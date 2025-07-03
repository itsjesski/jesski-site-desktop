// WebSocket server for the community virtual garden

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateToken, rateLimitToken, refreshToken } from '../tokenManager.js';
import { GARDEN_CONFIG, DEFAULT_GARDEN_STATE, DEFAULT_COMMUNITY_STATS } from '../../../config/garden.js';
import { SYSTEM_CONFIG } from '../../../config/system.js';
import { batchWriteJSON } from '../../../utils/batchedFileWriter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../..');

// Construct paths from config
const GARDEN_STATE_PATH = path.join(projectRoot, GARDEN_CONFIG.paths.gardenState);
const COMMUNITY_STATS_PATH = path.join(projectRoot, GARDEN_CONFIG.paths.communityStats);

// Extract configuration values
const {
  maxPlants,
  maxMagicItems,
  maxRecentHarvests
} = GARDEN_CONFIG.limits;

// System-wide WebSocket and caching settings
const {
  maxConnections: maxWebSocketClients,
  connectionTimeoutMs,
  inactiveTimeoutMs
} = SYSTEM_CONFIG.websocket.limits;

const {
  stateCacheTtlMs
} = SYSTEM_CONFIG.cache.timing;

// Garden-specific timing settings
const {
  plantWaterLossDelayMs,
  plantDiseaseLossDelayMs,
  fertilizerCooldownMs,
  magicCleanupIntervalMs
} = GARDEN_CONFIG.timing;

const { connectionCleanupIntervalMs } = SYSTEM_CONFIG.websocket.timing;

const { types: plantTypes, fertilizerGrowthMultiplier } = GARDEN_CONFIG.plants;
const { maxActiveMagic, types: magicTypes } = GARDEN_CONFIG.magic;

// State caching to reduce file I/O (memory-optimized)
let stateCache = null;
let lastStateRead = 0;
let communityStatsCache = null;
let lastStatsRead = 0;

function ensureDataDirectory() {
  const dataDir = path.dirname(GARDEN_STATE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readGardenState() {
  const now = Date.now();
  if (stateCache && (now - lastStateRead) < stateCacheTtlMs) {
    return stateCache;
  }
  
  try {
    ensureDataDirectory();
    
    if (!fs.existsSync(GARDEN_STATE_PATH)) {
      writeGardenState(DEFAULT_GARDEN_STATE);
      stateCache = DEFAULT_GARDEN_STATE;
      lastStateRead = now;
      return stateCache;
    }
    
    const fileContent = fs.readFileSync(GARDEN_STATE_PATH, 'utf-8');
    const parsedState = JSON.parse(fileContent);
    
    stateCache = {
      ...DEFAULT_GARDEN_STATE,
      ...parsedState,
      stats: {
        ...DEFAULT_GARDEN_STATE.stats,
        ...(parsedState.stats || {})
      }
    };
    
    lastStateRead = now;
    return stateCache;
  } catch (err) {
    console.error('Error reading garden state, using defaults:', err);
    stateCache = DEFAULT_GARDEN_STATE;
    lastStateRead = now;
    return stateCache;
  }
}

function writeGardenState(state) {
  // Apply memory limits and cleanup before saving
  const optimizedState = optimizeGardenState(state);
  
  stateCache = optimizedState;
  lastStateRead = Date.now();
  
  // Use batched file writer to reduce I/O
  batchWriteJSON(GARDEN_STATE_PATH, optimizedState).catch(err => {
    console.error('Failed to write garden state:', err);
  });
}

function optimizeGardenState(state) {
  const optimized = { ...state };
  
  // Clean up expired magic items first
  const currentTime = Date.now();
  optimized.magic = optimized.magic.filter(magic => currentTime < magic.expiresAt);
  
  // Limit total plants (remove oldest if exceeded)
  if (optimized.plants.length > maxPlants) {
    optimized.plants = optimized.plants
      .sort((a, b) => b.plantedAt - a.plantedAt) // Sort by newest first
      .slice(0, maxPlants);
  }
  
  // Limit magic items (remove oldest if exceeded)
  if (optimized.magic.length > maxMagicItems) {
    optimized.magic = optimized.magic
      .sort((a, b) => b.placedAt - a.placedAt) // Sort by newest first
      .slice(0, maxMagicItems);
  }
  
  // Limit recent harvests
  if (optimized.recentHarvests && optimized.recentHarvests.length > maxRecentHarvests) {
    optimized.recentHarvests = optimized.recentHarvests.slice(0, maxRecentHarvests);
  }
  
  return optimized;
}

function broadcast(wss, data) {
  const msg = JSON.stringify(data);
  const deadConnections = [];
  
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      try {
        client.send(msg);
      } catch (err) {
        console.error('Failed to send message to client:', err);
        deadConnections.push(client);
      }
    } else {
      deadConnections.push(client);
    }
  });
  
  deadConnections.forEach(client => {
    try {
      client.terminate();
    } catch (err) {
      // Ignore errors during cleanup
    }
  });
}

export function attachGardenWebSocketServer(server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/garden/ws',
    // Memory optimization: limit concurrent connections for 512MB environment
    maxClients: maxWebSocketClients
  });
  
  // Connection timeout and cleanup (optimized for low memory)
  const connections = new Map(); // track connection metadata

  wss.on('connection', (ws, req) => {
    let token;
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      token = url.searchParams.get('token');
    } catch {
      ws.close(4001, 'Invalid connection URL');
      return;
    }
    // For WebSocket connections, be a bit more lenient with token validation
    // This prevents unexpected disconnections
    if (!token) {
      console.log('WebSocket connection attempt with no token');
      ws.close(4002, 'Missing token');
      return;
    }
    
    // Validate the token
    if (!validateToken(token)) {
      console.log('WebSocket connection attempt with invalid token');
      ws.close(4002, 'Invalid token');
      return;
    }
    
    // Check rate limiting but don't apply it to refresh operations
    if (!rateLimitToken(token)) {
      console.log('WebSocket connection rate limit exceeded');
      ws.close(4003, 'Rate limit exceeded');
      return;
    }
    
    // Refresh the token on successful connection to prevent expiry
    refreshToken(token);
    
    // Track connection metadata
    const connectionId = Date.now() + Math.random();
    const connectionData = {
      token,
      lastActivity: Date.now(),
      messageCount: 0,
      connectedAt: Date.now()
    };
    connections.set(connectionId, connectionData);
    
    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === 1) {
        ws.close(4004, 'Connection timeout');
      }
      connections.delete(connectionId);
    }, connectionTimeoutMs);
    
    // Set inactivity timeout (reset on each message)
    let inactivityTimeout = setTimeout(() => {
      if (ws.readyState === 1) {
        ws.close(4005, 'Inactive timeout');
      }
      connections.delete(connectionId);
    }, inactiveTimeoutMs);
    
    // Send initial state with community stats
    const gardenState = readGardenState();
    const communityStats = readCommunityStats();
    ws.send(JSON.stringify({ 
      type: 'init', 
      state: gardenState,
      communityStats: communityStats
    }));

    ws.on('message', (msg) => {
      // Update activity tracking
      connectionData.lastActivity = Date.now();
      connectionData.messageCount++;
      
      // Reset inactivity timeout
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        if (ws.readyState === 1) {
          ws.close(4005, 'Inactive timeout');
        }
        connections.delete(connectionId);
      }, inactiveTimeoutMs);
      
      let data;
      try {
        data = JSON.parse(msg);
      } catch {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
        return;
      }
      // Apply rate limiting for all actions except refresh
      if (data.type === 'action') {
        // Refresh actions don't count towards rate limit
        if (data.action !== 'refresh') {
          // All other actions are subject to rate limiting
          if (!rateLimitToken(token)) {
            ws.send(JSON.stringify({ type: 'error', error: 'Rate limit exceeded' }));
            return;
          }
        }
        
        // But regardless of action type, refresh the token to prevent expiry
        refreshToken(token);
      }
      
      // Handle garden actions
      // { type: 'action', action: 'plant'|'water'|'fertilize'|'weed'|'magic'|'harvest', ... }
      if (data.type === 'action') {
        let state = readGardenState();
        
        // Ensure magic array exists for backward compatibility
        if (!state.magic) {
          state.magic = [];
        }
        if (!state.stats.totalMagicPlaced) {
          state.stats.totalMagicPlaced = 0;
        }
        if (!state.stats.totalMagicFaded) {
          state.stats.totalMagicFaded = 0;
        }
        
        let updated = false;
        
        switch (data.action) {
          case 'plant':
            // Add a new plant with growth stages
            const randomPlantType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
            state.plants.push({ 
              type: randomPlantType.name,
              stages: randomPlantType.stages,
              currentStage: 0,
              emoji: randomPlantType.stages[0],
              plantedAt: Date.now(),
              lastWatered: Date.now(),
              lastFertilized: 0, // Initialize fertilizer timestamp
              growthTime: randomPlantType.growthTime,
              waterNeeded: randomPlantType.waterNeeded,
              timesWatered: 0,
              health: 'healthy', // healthy, wilted, diseased
              isHarvestReady: false
            });
            state.stats.totalPlanted++;
            updateCommunityStats('plant');
            updated = true;
            break;
            
          case 'water':
            if (state.plants.length > 0) {
              // Water all plants and improve their health
              state.plants.forEach(plant => {
                plant.lastWatered = Date.now();
                plant.timesWatered++;
                if (plant.health === 'wilted') {
                  plant.health = 'healthy';
                }
              });
              state.stats.totalWatered++;
              updateCommunityStats('water');
              updated = true;
            }
            break;
            
          case 'fertilize':
            if (state.plants.length > 0) {
              // Fertilize plants that need it (more generous conditions)
              let fertilizedCount = 0;
              state.plants.forEach(plant => {
                // Fertilize any plant that hasn't been fertilized recently
                if (plant.currentStage < plant.stages.length - 1 &&
                    (!plant.lastFertilized || Date.now() - plant.lastFertilized > fertilizerCooldownMs)) {
                  plant.lastFertilized = Date.now();
                  // Speed up growth by configured multiplier
                  plant.growthTime = Math.floor(plant.growthTime * fertilizerGrowthMultiplier);
                  fertilizedCount++;
                }
              });
              if (fertilizedCount > 0) {
                state.stats.totalFertilized++;
                updateCommunityStats('fertilize');
                updated = true;
              }
            }
            break;
            
          case 'weed':
            if (state.plants.length > 0) {
              // Cure diseased plants and improve health of others
              let treatedCount = 0;
              state.plants.forEach(plant => {
                if (plant.health === 'diseased') {
                  plant.health = 'healthy';
                  treatedCount++;
                } else if (plant.health === 'wilted') {
                  plant.health = 'healthy';
                  treatedCount++;
                }
              });
              
              if (treatedCount > 0) {
                state.stats.totalWeedsPulled++;
                updateCommunityStats('weed');
                updated = true;
              }
            }
            break;
            
            case 'magic':
            // Check magic limit (max active magic items from config)
            const activeMagicCount = state.magic.filter(magic => Date.now() < magic.expiresAt).length;
            if (activeMagicCount >= maxActiveMagic) {
              // Don't add new magic if we already have max active items
              break;
            }
            
            // Add magic elements with gameplay effects
            const randomMagic = magicTypes[Math.floor(Math.random() * magicTypes.length)];
            state.magic.push({ 
              emoji: randomMagic.emoji,
              effect: randomMagic.effect,
              strength: randomMagic.strength,
              placedAt: Date.now(),
              expiresAt: Date.now() + randomMagic.duration
            });
            state.stats.totalMagicPlaced++;
            updateCommunityStats('magic_place');
            updated = true;
            break;
            
          case 'harvest':
            // Only harvest plants that are ready (fully mature)
            const harvestReady = state.plants.filter(plant => plant.isHarvestReady);
            if (harvestReady.length > 0) {
              let totalHarvested = 0;
              
              // Calculate harvest with bonuses
              harvestReady.forEach(plant => {
                const baseHarvest = 1;
                const multiplier = plant.harvestMultiplier || 1;
                totalHarvested += Math.floor(baseHarvest * multiplier);
              });
              
              // Remove harvested plants
              state.plants = state.plants.filter(plant => !plant.isHarvestReady);
              
              // Update harvest stats (simplified)
              state.stats.totalHarvested += totalHarvested;
              updateCommunityStats('harvest', { count: totalHarvested });
              updated = true;
            }
            break;
            
          case 'refresh':
            // Periodic state refresh - no action needed, just update plants and send current state
            // This will trigger the plant update logic below
            break;
        }
        
        // Update plant growth and health
        const currentTime = Date.now();
        
        // Calculate active magic effects (prevent stacking of same effects)
        const activeMagic = state.magic.filter(magic => currentTime < magic.expiresAt);
        const effects = {
          growthBoost: 0,
          harvestBoost: 0,
          healthBoost: false,
          diseaseProtection: false,
          waterRetention: 0,
          happiness: 0,
          pestControl: false
        };
        
        // Track which effect types are already applied to prevent stacking
        const appliedEffects = new Set();
        
        activeMagic.forEach(magic => {
          // Only apply each effect type once
          if (!appliedEffects.has(magic.effect)) {
            appliedEffects.add(magic.effect);
            
            switch(magic.effect) {
              case 'growth_boost':
                effects.growthBoost = magic.strength; // Use single value, don't stack
                break;
              case 'harvest_boost':
                effects.harvestBoost = magic.strength;
                break;
              case 'health_boost':
                effects.healthBoost = true;
                break;
              case 'disease_protection':
                effects.diseaseProtection = true;
                break;
              case 'water_retention':
                effects.waterRetention = magic.strength;
                break;
              case 'happiness':
                effects.happiness = magic.strength;
                break;
              case 'pest_control':
                effects.pestControl = true;
                break;
            }
          }
        });
        
        state.plants.forEach(plant => {
          const age = currentTime - plant.plantedAt;
          const timeSinceWater = currentTime - plant.lastWatered;
          
          // Apply water retention effect (more generous timing)
          const waterLossDelay = effects.waterRetention > 0 ? 
            plantWaterLossDelayMs * (1 + effects.waterRetention) : plantWaterLossDelayMs;
          const diseaseLossDelay = effects.waterRetention > 0 ? 
            plantDiseaseLossDelayMs * (1 + effects.waterRetention) : plantDiseaseLossDelayMs;
          
          // Check if plant needs water (with magic effects)
          if (timeSinceWater > waterLossDelay) {
            if (plant.health === 'healthy' && !effects.healthBoost) {
              plant.health = 'wilted';
              updated = true;
            } else if (timeSinceWater > diseaseLossDelay && plant.health === 'wilted' && 
                      !effects.diseaseProtection && !effects.pestControl) {
              // Plant becomes diseased if not protected by magic
              plant.health = 'diseased';
              updated = true;
            }
          }
          
          // Plant growth logic with magic effects
          if (plant.health === 'healthy' && plant.timesWatered >= plant.waterNeeded) {
            // Apply growth boost from magic
            const effectiveGrowthTime = plant.growthTime * (1 - effects.growthBoost - effects.happiness);
            const growthProgress = age / effectiveGrowthTime;
            const newStage = Math.min(Math.floor(growthProgress * plant.stages.length), plant.stages.length - 1);
            
            // Calculate progress and stage percentage for frontend
            const overallProgress = Math.min(growthProgress, 1);
            const stageProgress = growthProgress * plant.stages.length; // Progress across all stages
            
            // Calculate progress within the current stage
            let stagePercent;
            if (plant.currentStage >= plant.stages.length - 1) {
              // If in final stage, calculate progress within that stage
              const finalStageProgress = stageProgress - (plant.stages.length - 1);
              stagePercent = Math.min(finalStageProgress * 100, 100);
            } else {
              // Progress within current stage (0-100% for each stage)
              const stageStart = plant.currentStage;
              const stageEnd = plant.currentStage + 1;
              const progressInCurrentStage = Math.max(0, Math.min(stageProgress - stageStart, 1));
              stagePercent = progressInCurrentStage * 100;
            }
            
            // Update plant data
            plant.progress = Math.round(overallProgress * 100);
            plant.stagePercent = Math.round(stagePercent);
            
            if (newStage > plant.currentStage) {
              plant.currentStage = newStage;
              plant.emoji = plant.stages[newStage];
              updated = true;
            }
            
            // Mark as harvest ready when fully grown
            if (plant.currentStage === plant.stages.length - 1 && !plant.isHarvestReady) {
              plant.isHarvestReady = true;
              // Apply harvest boost effect
              if (effects.harvestBoost > 0) {
                plant.harvestMultiplier = 1 + effects.harvestBoost;
              }
              updated = true;
            }
          } else {
            // For unhealthy plants or plants that need water, calculate basic progress
            const basicProgress = Math.min(age / plant.growthTime, 1);
            const stageProgress = basicProgress * plant.stages.length; // Progress across all stages
            
            // Calculate progress within the current stage
            let stagePercent;
            if (plant.currentStage >= plant.stages.length - 1) {
              // If in final stage, calculate progress within that stage
              const finalStageProgress = stageProgress - (plant.stages.length - 1);
              stagePercent = Math.min(finalStageProgress * 100, 100);
            } else {
              // Progress within current stage (0-100% for each stage)
              const stageStart = plant.currentStage;
              const stageEnd = plant.currentStage + 1;
              const progressInCurrentStage = Math.max(0, Math.min(stageProgress - stageStart, 1));
              stagePercent = progressInCurrentStage * 100;
            }
            
            plant.progress = Math.round(basicProgress * 100);
            plant.stagePercent = Math.round(stagePercent);
          }
        });

        // Clean up expired magic
        const now = Date.now();
        const initialMagicCount = state.magic.length;
        state.magic = state.magic.filter(magic => now < magic.expiresAt);
        const removedMagic = initialMagicCount - state.magic.length;
        if (removedMagic > 0) {
          state.stats.totalMagicFaded += removedMagic;
          // Update community stats for each magic item that faded
          for (let i = 0; i < removedMagic; i++) {
            updateCommunityStats('magic_fade');
          }
          updated = true;
        }
        
        if (updated) {
          writeGardenState(state);
          const communityStats = readCommunityStats();
          broadcast(wss, { 
            type: 'update', 
            state,
            communityStats 
          });
        }
        
        ws.send(JSON.stringify({ type: 'ack', action: data.action }));
      }
    });
    
    ws.on('close', () => {
      clearTimeout(connectionTimeout);
      clearTimeout(inactivityTimeout);
      connections.delete(connectionId);
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
      clearTimeout(connectionTimeout);
      clearTimeout(inactivityTimeout);
      connections.delete(connectionId);
    });
  });

  wss.on('error', (err) => {
    console.error('WebSocket server error:', err);
  });
  
  // Periodic cleanup of expired connections and magic items
  setInterval(() => {
    const now = Date.now();
    for (const [id, data] of connections.entries()) {
      // Clean up stale connection data
      if (now - data.lastActivity > inactiveTimeoutMs * 2) {
        connections.delete(id);
      }
    }
    
    // Clean up expired magic items to prevent memory growth
    const state = readGardenState();
    const originalMagicCount = state.magic.length;
    state.magic = state.magic.filter(magic => now < magic.expiresAt);
    
    if (state.magic.length < originalMagicCount) {
      // Update magic faded count
      const fadedCount = originalMagicCount - state.magic.length;
      state.stats.totalMagicFaded += fadedCount;
      updateCommunityStats('magic_fade', { count: fadedCount });
      writeGardenState(state);
      
      // Broadcast updated state to all clients
      broadcast(wss, { 
        type: 'update', 
        state: state,
        communityStats: readCommunityStats()
      });
    }
    
    // Log connection stats (optional, for monitoring)
    if (connections.size > 0) {
      console.log(`Active connections: ${connections.size}, Active WebSocket clients: ${wss.clients.size}`);
    }
  }, connectionCleanupIntervalMs);

  return wss;
}

function readCommunityStats() {
  const now = Date.now();
  if (communityStatsCache && (now - lastStatsRead) < stateCacheTtlMs) {
    return communityStatsCache;
  }
  
  try {
    ensureDataDirectory();
    
    if (!fs.existsSync(COMMUNITY_STATS_PATH)) {
      writeCommunityStats(DEFAULT_COMMUNITY_STATS);
      communityStatsCache = DEFAULT_COMMUNITY_STATS;
      lastStatsRead = now;
      return communityStatsCache;
    }
    
    const fileContent = fs.readFileSync(COMMUNITY_STATS_PATH, 'utf-8');
    const parsedStats = JSON.parse(fileContent);
    
    communityStatsCache = {
      ...DEFAULT_COMMUNITY_STATS,
      ...parsedStats
    };
    
    lastStatsRead = now;
    return communityStatsCache;
  } catch (err) {
    console.error('Error reading community stats, using defaults:', err);
    communityStatsCache = DEFAULT_COMMUNITY_STATS;
    lastStatsRead = now;
    return communityStatsCache;
  }
}

function writeCommunityStats(stats) {
  communityStatsCache = { ...stats, lastUpdated: new Date().toISOString() };
  lastStatsRead = Date.now();
  
  // Use batched file writer to reduce I/O
  batchWriteJSON(COMMUNITY_STATS_PATH, communityStatsCache).catch(err => {
    console.error('Failed to write community stats:', err);
  });
}

// Update community stats whenever garden stats change
function updateCommunityStats(action, data = {}) {
  const communityStats = readCommunityStats();
  
  switch (action) {
    case 'plant':
      communityStats.totalPlanted++;
      break;
    case 'harvest':
      const count = data.count || 1;
      communityStats.totalHarvested += count;
      break;
    case 'water':
      communityStats.totalWatered++;
      break;
    case 'fertilize':
      communityStats.totalFertilized++;
      break;
    case 'weed':
      communityStats.totalWeedsPulled++;
      break;
    case 'magic_place':
      communityStats.totalMagicPlaced++;
      break;
    case 'magic_fade':
      const fadeCount = data.count || 1;
      communityStats.totalMagicFaded += fadeCount;
      break;
  }
  
  writeCommunityStats(communityStats);
}
