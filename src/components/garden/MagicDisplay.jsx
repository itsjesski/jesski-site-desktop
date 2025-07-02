import React from 'react';

export default function MagicDisplay({ magic, index }) {
  return (
    <div key={index} className="relative inline-block group">
      <span className="text-2xl plant-growth animate-pulse">{magic.emoji}</span>
      {/* Show magic effect on hover */}
      {magic.effect && magic.effect !== 'none' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 tooltip-slide-up">
          <div className="bg-purple-600 bg-opacity-90 text-white text-xs px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap">
            {magic.effect === 'growth_boost' && '🚀 +20% Growth Speed'}
            {magic.effect === 'harvest_boost' && '✨ +50% Harvest Yield'}
            {magic.effect === 'health_boost' && '💚 Health Protection'}
            {magic.effect === 'disease_protection' && '🛡️ Disease Immunity'}
            {magic.effect === 'water_retention' && '💧 +50% Water Duration'}
            {magic.effect === 'happiness' && '😊 +10% All Bonuses'}
            {magic.effect === 'pest_control' && '🐞 Pest Protection'}
          </div>
        </div>
      )}
    </div>
  );
}
