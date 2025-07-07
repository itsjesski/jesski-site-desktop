import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDesktopStore } from '../store/desktopStore';
import { encodeDesktopState, decodeDesktopState } from '../utils/urlRouter';

/**
 * Hook to synchronize desktop state with URL
 */
export const useUrlSync = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { windows, openWindow, focusWindow, activeWindowId } = useDesktopStore();

  // Sync desktop state to URL when windows change
  const syncToUrl = useCallback(() => {
    const currentPath = encodeDesktopState(windows, activeWindowId);
    
    // Only navigate if the URL actually needs to change
    if (location.pathname + location.search !== currentPath) {
      navigate(currentPath, { replace: true });
    }
  }, [windows, activeWindowId, navigate, location.pathname, location.search]);

  // Sync URL to desktop state when URL changes
  const syncFromUrl = useCallback(() => {
    const { windows: urlWindows, activeApp } = decodeDesktopState(
      location.pathname,
      location.search
    );

    // Only open windows if they don't already exist
    urlWindows.forEach(windowData => {
      if (!windowData.component) return;

      // Check if window already exists
      const existingWindow = windows.find(w => 
        w.component === windowData.component && 
        w.title === windowData.title
      );

      if (!existingWindow) {
        openWindow({
          title: windowData.title || windowData.component,
          component: windowData.component as any,
          isMinimized: false,
          isMaximized: false,
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 },
          data: windowData.data
        });
      } else if (activeApp && windowData.component === activeApp) {
        // Focus the active window if specified
        focusWindow(existingWindow.id);
      }
    });
  }, [location.pathname, location.search, windows, openWindow, focusWindow]);

  // Initial URL sync on mount
  useEffect(() => {
    // Only sync from URL if we're not on the root path or if there are URL parameters
    if (location.pathname !== '/' || location.search) {
      syncFromUrl();
    }
  }, []); // Only run once on mount

  // Sync to URL when desktop state changes
  useEffect(() => {
    // Debounce URL updates to avoid excessive navigation
    const timeoutId = setTimeout(syncToUrl, 100);
    return () => clearTimeout(timeoutId);
  }, [syncToUrl]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      syncFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncFromUrl]);
};
