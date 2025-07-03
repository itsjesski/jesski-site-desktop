import React from 'react';

export default function StatsPanel({ garden, communityStats, totalPlants, harvestReady, needWater }) {
  return (
    <div className="w-full lg:w-80 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col max-h-full lg:max-h-full">
      <div className="p-3 lg:p-4 border-b border-gray-200">
        <h2 className="text-lg lg:text-xl font-bold text-green-700">📊 Garden Stats</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
        {/* Current Status */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-green-800">🌱 Current Status</h3>
          <div className="text-sm space-y-1">
            {totalPlants > 0 ? (
              <>
                <div className="flex justify-between">
                  <span>Total Plants:</span>
                  <span className="font-medium">{totalPlants}</span>
                </div>
                {harvestReady > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>✨ Ready to Harvest:</span>
                    <span className="font-medium">{harvestReady}</span>
                  </div>
                )}
                {needWater > 0 ? (
                  <div className="flex justify-between text-blue-600">
                    <span>💧 Need Water:</span>
                    <span className="font-medium">{needWater}</span>
                  </div>
                ) : (
                  <div className="text-green-600">💚 All plants healthy!</div>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-center py-2">Garden is empty</div>
            )}
          </div>
        </div>

        {/* Active Effects */}
        <div className="p-3 bg-purple-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-purple-800">✨ Active Effects</h3>
          <div className="text-sm space-y-1">
            {/* Active Magic Effects - deduplicated */}
            {garden.magic && (() => {
              const activeMagic = garden.magic.filter(magic => magic.effect && magic.effect !== 'none' && Date.now() < magic.expiresAt);
              const uniqueEffects = [...new Set(activeMagic.map(magic => magic.effect))];
              
              return uniqueEffects.map(effect => {
                const magicWithEffect = activeMagic.find(magic => magic.effect === effect);
                return (
                  <div key={effect} className="flex items-center gap-2">
                    <span>{magicWithEffect.emoji}</span>
                    <span className="text-xs">
                      {effect === 'growth_boost' && 'Growth +20%'}
                      {effect === 'harvest_boost' && 'Harvest +50%'}
                      {effect === 'health_boost' && 'Health Protected'}
                      {effect === 'disease_protection' && 'Disease Immune'}
                      {effect === 'water_retention' && 'Water Lasts +50%'}
                      {effect === 'happiness' && 'All Bonuses +10%'}
                      {effect === 'pest_control' && 'Pest Protected'}
                    </span>
                  </div>
                );
              });
            })()}
            
            {/* Active Fertilizer Effects */}
            {garden.plants && garden.plants.some(plant => 
              plant.lastFertilized && Date.now() - plant.lastFertilized < 300000
            ) && (
              <div className="flex items-center gap-2">
                <span>🌼</span>
                <span className="text-xs">Fertilizer Active</span>
              </div>
            )}
            
            {/* Show "No active effects" if nothing is active */}
            {(!garden.magic || garden.magic.filter(magic => magic.effect && magic.effect !== 'none' && Date.now() < magic.expiresAt).length === 0) &&
             (!garden.plants || !garden.plants.some(plant => plant.lastFertilized && Date.now() - plant.lastFertilized < 300000)) && (
              <div className="text-gray-500 text-center py-1">No active effects</div>
            )}
          </div>
        </div>

        {/* Community Stats - All Time Totals */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-800">🌍 Community All-Time Stats</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>🌱 Total Planted:</span>
              <span className="font-medium">{(communityStats?.totalPlanted || garden.stats.totalPlanted).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>💧 Total Watered:</span>
              <span className="font-medium">{(communityStats?.totalWatered || garden.stats.totalWatered).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>🌼 Total Fertilized:</span>
              <span className="font-medium">{(communityStats?.totalFertilized || garden.stats.totalFertilized).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>🧤 Weeds Pulled:</span>
              <span className="font-medium">{(communityStats?.totalWeedsPulled || garden.stats.totalWeedsPulled).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>✨ Magic Spells:</span>
              <span className="font-medium">{(communityStats?.totalMagicPlaced || garden.stats.totalMagicPlaced).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>🧺 Total Harvested:</span>
              <span className="font-medium">
                {(communityStats?.totalHarvested || garden.stats.totalHarvested || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
