import React from 'react';

export default function PlantDisplay({ plant, index }) {
  // Use server-provided data directly
  const sizeClass = plant.currentStage === 0 ? 'text-2xl' : 
                  plant.currentStage === 1 ? 'text-3xl' : 'text-4xl';
  
  return (
    <div key={index} className="relative inline-block">
      <span className={`${sizeClass} plant-growth transition-all duration-700 ${
        plant.health === 'diseased' ? 'grayscale' : 
        plant.health === 'wilted' ? 'opacity-60' : ''
      }`}>
        {plant.emoji}
      </span>
      
      {/* Visual indicators */}
      {plant.isHarvestReady && (
        <span className="absolute -top-1 -right-1 text-lg animate-pulse">✨</span>
      )}
      {plant.health === 'wilted' && (
        <span className="absolute -top-1 -left-1 text-lg">💧</span>
      )}
      {plant.health === 'diseased' && (
        <span className="absolute -top-1 -left-1 text-lg">🦠</span>
      )}
    </div>
  );
}
