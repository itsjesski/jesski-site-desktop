import React, { useState, useEffect } from 'react';
import { soundManager } from '../services/soundManager';
import type { WindowState } from '../types/window';
import { secureStorage } from '../utils/secureStorage';

interface SettingsAppProps {
  window: WindowState;
}

export const SettingsApp: React.FC<SettingsAppProps> = () => {
  const [affirmationsEnabled, setAffirmationsEnabled] = useState(true);
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [muted, setMuted] = useState(soundManager.isMuted());

  // Load settings from localStorage on mount
  useEffect(() => {
    const affirmationsSetting = secureStorage.getItem('jesski-desktop-affirmations') !== 'false';
    
    setAffirmationsEnabled(affirmationsSetting);
    setVolume(soundManager.getVolume());
    setMuted(soundManager.isMuted());
  }, []);

  const handleAffirmationsToggle = (enabled: boolean) => {
    setAffirmationsEnabled(enabled);
    secureStorage.setItem('jesski-desktop-affirmations', enabled.toString());
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
    
    // If volume is changed from 0, unmute
    if (newVolume > 0 && muted) {
      setMuted(false);
    }
  };

  const handleMuteToggle = () => {
    soundManager.toggleMute();
    setMuted(soundManager.isMuted());
    
    // Play click sound if unmuting
    if (muted) {
      setTimeout(() => soundManager.play('click'), 100);
    }
  };

  const resetAllSettings = () => {
    // Reset all settings to defaults
    secureStorage.removeItem('jesski-desktop-show-welcome');
    secureStorage.removeItem('jesski-desktop-affirmations');
    secureStorage.removeItem('jesski-desktop-sound-prefs');
    
    setShowWelcomeOnStartup(true);
    setAffirmationsEnabled(true);
    
    // Reset sound settings
    soundManager.setVolume(0.5);
    soundManager.toggleMute(); // If muted, unmute
    if (soundManager.isMuted()) {
      soundManager.toggleMute(); // Ensure unmuted
    }
    setVolume(0.5);
    setMuted(false);
    
    // Reload the page to apply all changes
    globalThis.window.location.reload();
  };

  return (
    <div className="h-full p-6 bg-white overflow-y-auto">
      <div className="max-w-2xl pb-16">{/* Added pb-16 for bottom padding */}
        {/* Header with version info */}
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Desktop Settings</h1>
          <p className="text-sm text-gray-500">
            JessOS Desktop Environment v1.0.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Settings are automatically saved to your browser
          </p>
        </div>
        
        {/* Audio Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Audio & Sound</h2>
          
          <div className="space-y-4">
            {/* Volume Control */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Volume</h3>
                <span className="text-sm text-gray-600">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mb-3"
                style={{ '--slider-progress': `${volume * 100}%` } as React.CSSProperties}
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={handleMuteToggle}
                  className="px-3 py-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                >
                  {muted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  onClick={() => soundManager.play('pop')}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Test Sound
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Affirmations Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Applications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <span className="text-white text-sm">♥</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Affirmations.exe</h3>
                  <p className="text-sm text-gray-600">Provides positive life tips and affirmations</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={affirmationsEnabled}
                  onChange={(e) => handleAffirmationsToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Advanced</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-800 mb-2">Reset All Settings</h3>
              <p className="text-sm text-red-700 mb-4">This will reset all desktop preferences to defaults and reload the page.</p>
              <button
                onClick={resetAllSettings}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
