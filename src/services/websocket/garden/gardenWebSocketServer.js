// WebSocket server for the community virtual garden

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateToken, rateLimitToken, refreshToken } from '../tokenManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../..');
const GARDEN_STATE_PATH = path.join(projectRoot, 'public/data/gardenState.json');
const COMMUNITY_STATS_PATH = path.join(projectRoot, 'public/data/communityStats.json');

// Default garden state structure
const DEFAULT_GARDEN_STATE = {
  plants: [],
  magic: [],
  stats: {
    totalPlanted: 0,
    totalHarvested: {},
    totalWatered: 0,
    totalFertilized: 0,
    totalWeedsPulled: 0,
    totalMagicPlaced: 0,
    totalMagicFaded: 0
  },
  recentHarvests: []
};

// Community stats structure (permanent, never reset)
const DEFAULT_COMMUNITY_STATS = {
  totalPlanted: 0,
  totalHarvested: 0,
  totalWatered: 0,
  totalFertilized: 0,
  totalWeedsPulled: 0,
  totalMagicPlaced: 0,
  totalMagicFaded: 0,
  lastUpdated: new Date().toISOString()
};

// State caching to reduce file I/O (memory-optimized)
let stateCache = null;
let lastStateRead = 0;
let communityStatsCache = null;
let lastStatsRead = 0;
const STATE_CACHE_TTL = 2000; // Increased from 1s to 2s to reduce I/O

// Memory limits for garden state
const GARDEN_LIMITS = {
  maxPlants: 100, // Limit total plants in garden
  maxMagicItems: 10, // Limit total magic items (reduced from unlimited)
  maxRecentHarvests: 20, // Limit harvest history
  maxHarvestHistory: 30 // Limit days of harvest history
};

function ensureDataDirectory() {
  const dataDir = path.dirname(GARDEN_STATE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readGardenState() {
  const now = Date.now();
  if (stateCache && (now - lastStateRead) < STATE_CACHE_TTL) {
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
  // Apply memory limits before saving
  const optimizedState = optimizeGardenState(state);
  
  stateCache = optimizedState;
  lastStateRead = Date.now();
  
  setImmediate(() => {
    try {
      ensureDataDirectory();
      fs.writeFileSync(GARDEN_STATE_PATH, JSON.stringify(optimizedState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write garden state:', err);
    }
  });
}

function optimizeGardenState(state) {
  const optimized = { ...state };
  
  // Limit total plants (remove oldest if exceeded)
  if (optimized.plants.length > GARDEN_LIMITS.maxPlants) {
    optimized.plants = optimized.plants
      .sort((a, b) => b.plantedAt - a.plantedAt) // Sort by newest first
      .slice(0, GARDEN_LIMITS.maxPlants);
  }
  
  // Limit magic items (remove oldest if exceeded)
  if (optimized.magic.length > GARDEN_LIMITS.maxMagicItems) {
    optimized.magic = optimized.magic
      .sort((a, b) => b.placedAt - a.placedAt) // Sort by newest first
      .slice(0, GARDEN_LIMITS.maxMagicItems);
  }
  
  // Limit recent harvests
  if (optimized.recentHarvests && optimized.recentHarvests.length > GARDEN_LIMITS.maxRecentHarvests) {
    optimized.recentHarvests = optimized.recentHarvests.slice(0, GARDEN_LIMITS.maxRecentHarvests);
  }
  
  // Limit harvest history (keep only recent days)
  if (optimized.stats.totalHarvested) {
    const harvestDates = Object.keys(optimized.stats.totalHarvested);
    if (harvestDates.length > GARDEN_LIMITS.maxHarvestHistory) {
      const sortedDates = harvestDates.sort((a, b) => new Date(b) - new Date(a));
      const recentDates = sortedDates.slice(0, GARDEN_LIMITS.maxHarvestHistory);
      const newHarvestStats = {};
      recentDates.forEach(date => {
        newHarvestStats[date] = optimized.stats.totalHarvested[date];
      });
      optimized.stats.totalHarvested = newHarvestStats;
    }
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
    maxClients: 25 // Reduced from unlimited to 25 concurrent connections
  });
  
  // Connection timeout and cleanup (optimized for low memory)
  const CONNECTION_TIMEOUT_MS = 20 * 60 * 1000; // Reduced from 30 to 20 minutes
  const INACTIVE_TIMEOUT_MS = 3 * 60 * 1000; // Reduced from 5 to 3 minutes
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
    }, CONNECTION_TIMEOUT_MS);
    
    // Set inactivity timeout (reset on each message)
    let inactivityTimeout = setTimeout(() => {
      if (ws.readyState === 1) {
        ws.close(4005, 'Inactive timeout');
      }
      connections.delete(connectionId);
    }, INACTIVE_TIMEOUT_MS);
    
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
      }, INACTIVE_TIMEOUT_MS);
      
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
            const plantTypes = [
              { name: 'sunflower', stages: ['🌱', '🌿', '🌻'], growthTime: 120000, waterNeeded: 2 }, // 2 min
              { name: 'rose', stages: ['🌱', '🥀', '🌹'], growthTime: 180000, waterNeeded: 3 }, // 3 min
              { name: 'tulip', stages: ['🌱', '🌿', '🌷'], growthTime: 150000, waterNeeded: 2 }, // 2.5 min
              { name: 'daisy', stages: ['🌱', '🌿', '🌼'], growthTime: 90000, waterNeeded: 1 }, // 1.5 min
              { name: 'cherry', stages: ['🌱', '🌿', '🌸'], growthTime: 200000, waterNeeded: 3 }, // 3.3 min  
            ];
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
              // Fertilize plants that need it (similar to watering)
              let fertilizedCount = 0;
              state.plants.forEach(plant => {
                // Only fertilize healthy plants that haven't been fertilized recently
                if (plant.health === 'healthy' && 
                    plant.currentStage < plant.stages.length - 1 &&
                    (!plant.lastFertilized || Date.now() - plant.lastFertilized > 300000)) { // 5 min cooldown
                  plant.lastFertilized = Date.now();
                  // Speed up growth by 25% for this plant
                  plant.growthTime = Math.floor(plant.growthTime * 0.75);
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
            // Check magic limit (max 5 active magic items)
            const activeMagicCount = state.magic.filter(magic => Date.now() < magic.expiresAt).length;
            if (activeMagicCount >= 5) {
              // Don't add new magic if we already have 5 active items
              break;
            }
            
            // Add magic elements with gameplay effects
            const magicTypes = [
              // Growth boosters
              { emoji: '🦋', effect: 'growth_boost', strength: 0.2, duration: 300000 }, // 5 min, 20% faster growth
              { emoji: '🐝', effect: 'harvest_boost', strength: 0.5, duration: 300000 }, // 5 min, 50% more harvest
              { emoji: '💚', effect: 'health_boost', strength: 1, duration: 300000 }, // 5 min, prevents disease
              // Protection magic
              { emoji: '🛡️', effect: 'disease_protection', strength: 1, duration: 600000 }, // 10 min, disease immunity
              { emoji: '💧', effect: 'water_retention', strength: 0.5, duration: 600000 }, // 10 min, 50% slower water loss
              // Garden-themed magical items
              { emoji: '🌙', effect: 'none', strength: 0, duration: 300000 }, // Moonlight blessing
              { emoji: '☀️', effect: 'none', strength: 0, duration: 300000 }, // Sunshine blessing
              { emoji: '🌟', effect: 'none', strength: 0, duration: 300000 }, // Starlight blessing
              { emoji: '✨', effect: 'happiness', strength: 0.1, duration: 300000 }, // 10% general boost
              { emoji: '🍄', effect: 'none', strength: 0, duration: 300000 }, // Magical mushroom
              { emoji: '🌈', effect: 'none', strength: 0, duration: 300000 }, // Rainbow blessing
              { emoji: '🐞', effect: 'pest_control', strength: 1, duration: 300000 }, // Prevents some diseases
              { emoji: '🦔', effect: 'none', strength: 0, duration: 300000 }, // Garden hedgehog
              { emoji: '🐿️', effect: 'none', strength: 0, duration: 300000 }, // Garden squirrel
            ];
            
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
              
              // Update harvest stats
              if (!state.stats.totalHarvested) state.stats.totalHarvested = {};
              const today = new Date().toDateString();
              state.stats.totalHarvested[today] = (state.stats.totalHarvested[today] || 0) + totalHarvested;
              updateCommunityStats('harvest', { type: today, count: totalHarvested });
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
          
          // Apply water retention effect
          const waterLossDelay = effects.waterRetention > 0 ? 
            60000 * (1 + effects.waterRetention) : 60000;
          const diseaseLossDelay = effects.waterRetention > 0 ? 
            120000 * (1 + effects.waterRetention) : 120000;
          
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
  
  // Periodic cleanup of expired connections and optimize broadcasts
  setInterval(() => {
    const now = Date.now();
    for (const [id, data] of connections.entries()) {
      // Clean up stale connection data
      if (now - data.lastActivity > INACTIVE_TIMEOUT_MS * 2) {
        connections.delete(id);
      }
    }
    
    // Log connection stats (optional, for monitoring)
    if (connections.size > 0) {
      console.log(`Active connections: ${connections.size}, Active WebSocket clients: ${wss.clients.size}`);
    }
  }, 60000); // Check every minute

  return wss;
}

function readCommunityStats() {
  const now = Date.now();
  if (communityStatsCache && (now - lastStatsRead) < STATE_CACHE_TTL) {
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
  
  setImmediate(() => {
    try {
      ensureDataDirectory();
      fs.writeFileSync(COMMUNITY_STATS_PATH, JSON.stringify(communityStatsCache, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write community stats:', err);
    }
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
      communityStats.totalMagicFaded++;
      break;
  }
  
  writeCommunityStats(communityStats);
}
