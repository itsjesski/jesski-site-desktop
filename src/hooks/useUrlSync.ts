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

    const isSameWindowTarget = (
      existing: { component: string; data?: Record<string, unknown> },
      incoming: { component?: string; data?: Record<string, unknown> }
    ) => {
      if (!incoming.component || existing.component !== incoming.component) {
        return false;
      }

      if (!incoming.data) {
        return true;
      }

      const existingData = existing.data ?? {};

      if (
        incoming.component === 'text-viewer' &&
        typeof incoming.data.fileName === 'string'
      ) {
        return existingData.fileName === incoming.data.fileName;
      }

      if (
        incoming.component === 'website-viewer' &&
        typeof incoming.data.url === 'string'
      ) {
        return existingData.url === incoming.data.url;
      }

      if (
        incoming.component === 'games-library' &&
        typeof incoming.data.selectedGame === 'string'
      ) {
        return existingData.selectedGame === incoming.data.selectedGame;
      }

      return true;
    };

    // Only open windows if they don't already exist
    urlWindows.forEach(windowData => {
      if (!windowData.component) return;

      const currentState = useDesktopStore.getState();

      // Check if window already exists
      const existingWindow = currentState.windows.find(w =>
        isSameWindowTarget(w, {
          component: windowData.component,
          data: windowData.data as Record<string, unknown> | undefined,
        })
      );

      if (!existingWindow) {
        openWindow({
          title: windowData.title || windowData.component,
          component: windowData.component,
          isMinimized: false,
          isMaximized: false,
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 },
          data: windowData.data
        });
      } else if (
        activeApp &&
        windowData.component === activeApp &&
        currentState.activeWindowId !== existingWindow.id
      ) {
        // Focus the active window if specified
        focusWindow(existingWindow.id);
      }
    });
  }, [location.pathname, location.search, openWindow, focusWindow]);

  // Initial URL sync on mount
  useEffect(() => {
    // Only sync from URL if we're not on the root path or if there are URL parameters
    if (location.pathname !== '/' || location.search) {
      syncFromUrl();
    }
  }, [location.pathname, location.search, syncFromUrl]);

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
