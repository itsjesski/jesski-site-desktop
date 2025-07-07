import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useDesktopStore } from '../../store/desktopStore';
import { soundManager } from '../../services/soundManager';

export const ReadmeControl: React.FC = () => {
  const openWindow = useDesktopStore(state => state.openWindow);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome README
    const seen = localStorage.getItem('jesski-desktop-welcome-seen') === 'true';
    setHasSeenWelcome(seen);
  }, []);

  const handleOpenReadme = () => {
    soundManager.play('click');
    
    // Create README window
    const windowData = {
      title: 'Welcome - README',
      component: 'text-viewer' as const,
      isMinimized: false,
      isMaximized: false,
      position: { x: 50, y: 50 },
      size: { width: 600, height: 500 },
      data: {
        fileName: 'README.txt'
      }
    };

    openWindow(windowData);

    // Mark as seen when manually opened
    if (!hasSeenWelcome) {
      localStorage.setItem('jesski-desktop-welcome-seen', 'true');
      setHasSeenWelcome(true);
    }
  };

  return (
    <button
      onClick={handleOpenReadme}
      className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
      title="Show Welcome Guide"
    >
      <HelpCircle className="w-4 h-4 text-gray-600" />
    </button>
  );
};
