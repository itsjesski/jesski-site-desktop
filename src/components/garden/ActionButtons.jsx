import React from 'react';

export default function ActionButtons({ 
  handleAction, 
  actionLoading, 
  rateLimited,
  needWater, 
  needFertilizer, 
  needWeeding, 
  harvestReady,
  activeMagicCount
}) {
  const isDisabled = (action, condition = false) => 
    actionLoading[action] || rateLimited || condition;

  const isMagicAtLimit = activeMagicCount >= 5;

  return (
    <div className="flex gap-2 flex-wrap">
      {rateLimited && (
        <div className="w-full text-center text-amber-700 text-sm py-2 px-3 bg-amber-100 border border-amber-300 rounded-md mb-2 flex items-center justify-center gap-2">
          <span className="animate-pulse">⏳</span>
          <span>Slow down there, gardener! Please wait a moment before the next action...</span>
        </div>
      )}
      
      <button 
        type="button" 
        onClick={(e) => handleAction(e, 'plant')}
        className="btn" 
        disabled={isDisabled('plant')}
      >
        {actionLoading.plant ? '⏳' : '🌱'} Plant
      </button>
      <button 
        type="button" 
        onClick={(e) => handleAction(e, 'water')}
        className="btn" 
        disabled={isDisabled('water', needWater === 0)}
      >
        {actionLoading.water ? '⏳' : '💧'} Water {needWater > 0 && `(${needWater}!)`}
      </button>
      <button 
        type="button" 
        onClick={(e) => handleAction(e, 'fertilize')}
        className="btn" 
        disabled={isDisabled('fertilize', needFertilizer === 0)}
      >
        {actionLoading.fertilize ? '⏳' : '🌼'} Fertilize {needFertilizer > 0 && `(${needFertilizer}!)`}
      </button>
      <button 
        type="button" 
        onClick={(e) => handleAction(e, 'weed')}
        className="btn" 
        disabled={isDisabled('weed', needWeeding === 0)}
      >
        {actionLoading.weed ? '⏳' : '🧤'} Weed {needWeeding > 0 && `(${needWeeding}!)`}
      </button>
      <button 
        type="button" 
        onClick={(e) => handleAction(e, 'magic')}
        className="btn bg-purple-500 hover:bg-purple-600" 
        disabled={isDisabled('magic', isMagicAtLimit)}
      >
        {actionLoading.magic ? '⏳' : '✨'} Magic {isMagicAtLimit ? '(5/5)' : `(${activeMagicCount}/5)`}
      </button>
      <button 
        type="button" 
        onClick={(e) => handleAction(e, 'harvest')}
        className={`btn ${harvestReady > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
        disabled={isDisabled('harvest', harvestReady === 0)}
      >
        {actionLoading.harvest ? '⏳' : '🧺'} Harvest {harvestReady > 0 ? `(${harvestReady}!)` : '(0)'}
      </button>
    </div>
  );
}
