import React from 'react';
import PlantDisplay from './PlantDisplay.jsx';
import MagicDisplay from './MagicDisplay.jsx';
import ActionButtons from './ActionButtons.jsx';
import StatsPanel from './StatsPanel.jsx';
import { useGardenWebSocket } from './hooks/useGardenWebSocket.js';
import { gardenStyles } from './GardenStyles.js';

export default function GardenApp() {
  const { garden, error, isLoading, actionLoading, rateLimited, handleAction } = useGardenWebSocket();

  // Prevent any form submission
  function handleFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  if (isLoading) return <div className="p-4">Loading garden...</div>;
  // Only show errors that aren't rate limits, and only if we don't have garden data yet
  if (error && !error.toLowerCase().includes('rate limit') && !garden) return <div className="p-4 text-red-600">{error}</div>;
  if (!garden) return <div className="p-4">Connecting to garden...</div>;

  // Use server-provided plant data directly (no client-side calculations)
  const plants = garden.plants || [];
  const harvestReady = plants.filter(plant => plant.isHarvestReady).length;
  const totalPlants = plants.length;
  const needWater = plants.filter(plant => plant.health === 'wilted').length;
  const needFertilizer = plants.filter(plant => 
    plant.health === 'healthy' && 
    plant.currentStage < (plant.stages?.length - 1 || 2) &&
    (!plant.lastFertilized || Date.now() - plant.lastFertilized > 300000) // 5 min cooldown
  ).length;
  const needWeeding = plants.filter(plant => plant.health === 'diseased').length;
  const activeMagicCount = garden.magic ? garden.magic.filter(magic => Date.now() < magic.expiresAt).length : 0;

  return (
    <>
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{ __html: gardenStyles }} />
      
      <div 
        className="h-full p-2 lg:p-4 bg-green-50"
        onSubmit={handleFormSubmit}
      >
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Main Garden Area */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">🌱 Community Garden</h1>
            <div className="mb-4 text-gray-700 text-sm lg:text-base">
              A real-time virtual garden grown by everyone! Plant seeds, water regularly, and watch them grow through different stages. Add magical spells for special effects!
              <div className="mt-2 text-xs text-gray-600">
                <strong>Legend:</strong> ✨ Ready to harvest • 💧 Needs water • 🦠 Diseased (use weed tool)
              </div>
            </div>

            {/* Garden Display */}
            <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-white rounded-lg shadow-inner min-h-[150px] lg:min-h-[200px] border-2 border-green-200">
              <div className="flex flex-wrap gap-2 lg:gap-3">
                {totalPlants === 0 && (!garden.magic || garden.magic.filter(magic => Date.now() < magic.expiresAt).length === 0) && (
                  <div className="w-full text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">🌱</div>
                    <div>Empty garden. Plant some seeds to get started!</div>
                  </div>
                )}
                
                {plants.map((plant, i) => (
                  <PlantDisplay key={i} plant={plant} index={i} />
                ))}
                
                {garden.magic && garden.magic
                  .filter(magic => Date.now() < magic.expiresAt)
                  .map((magic, i) => (
                    <MagicDisplay key={i} magic={magic} index={i} />
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <ActionButtons 
              handleAction={handleAction}
              actionLoading={actionLoading}
              rateLimited={rateLimited}
              needWater={needWater}
              needFertilizer={needFertilizer}
              needWeeding={needWeeding}
              harvestReady={harvestReady}
              activeMagicCount={activeMagicCount}
            />
          </div>

          {/* Right Column - Stats Panel */}
          <StatsPanel 
            garden={garden}
            totalPlants={totalPlants}
            harvestReady={harvestReady}
            needWater={needWater}
          />
        </div>
      </div>
    </>
  );
}