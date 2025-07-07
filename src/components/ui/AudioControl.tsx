import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../../services/soundManager';
import { useDesktopStore } from '../../store/desktopStore';

export const AudioControl: React.FC = () => {
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [muted, setMuted] = useState(soundManager.isMuted());
  const { openWindow } = useDesktopStore();

  // Update volume and mute state when sound manager changes
  useEffect(() => {
    const updateAudioState = () => {
      setVolume(soundManager.getVolume());
      setMuted(soundManager.isMuted());
    };

    // Check for updates periodically
    const interval = setInterval(updateAudioState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVolumeButtonClick = () => {
    soundManager.play('click');
    
    // Open the settings window focused on audio section
    openWindow({
      title: 'Settings',
      component: 'settings',
      isMinimized: false,
      isMaximized: false,
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 }
    });
  };

  return (
    <button
      onClick={handleVolumeButtonClick}
      className="w-8 h-8 flex items-center justify-center rounded transition-colors"
      style={{
        color: 'var(--taskbar-text)',
        backgroundColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--taskbar-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      title={muted ? 'Audio muted - Click to open settings' : `Volume: ${Math.round(volume * 100)}% - Click to open settings`}
    >
      {muted || volume === 0 ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
};
