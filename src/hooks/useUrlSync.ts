import { useEffect, useCallback, useRef } from 'react';
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
  const skipNextSyncFromUrlRef = useRef(false);

  // Sync desktop state to URL when windows change
  const syncToUrl = useCallback(() => {
    const currentPath = encodeDesktopState(windows, activeWindowId);
    
    // Only navigate if the URL actually needs to change
    if (location.pathname + location.search !== currentPath) {
      skipNextSyncFromUrlRef.current = true;
      navigate(currentPath, { replace: true });
    }
  }, [windows, activeWindowId, navigate, location.pathname, location.search]);

  // Sync URL to desktop state when URL changes
  const syncFromUrl = useCallback(() => {
    const { windows: urlWindows, activeApp, activeWindowIndex } = decodeDesktopState(
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

    const resolvedWindowIds: Array<string | undefined> = [];

    // Only open windows if they don't already exist
    urlWindows.forEach((windowData, index) => {
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
        const stateAfterOpen = useDesktopStore.getState();
        const openedWindow = stateAfterOpen.windows.find(w =>
          isSameWindowTarget(w, {
            component: windowData.component,
            data: windowData.data as Record<string, unknown> | undefined,
          })
        );
        resolvedWindowIds[index] = openedWindow?.id;
      } else if (
        activeApp &&
        windowData.component === activeApp &&
        currentState.activeWindowId !== existingWindow.id
      ) {
        // Focus the active window if specified
        focusWindow(existingWindow.id);
        resolvedWindowIds[index] = existingWindow.id;
      } else {
        resolvedWindowIds[index] = existingWindow.id;
      }
    });

    if (
      typeof activeWindowIndex === 'number' &&
      activeWindowIndex >= 0 &&
      activeWindowIndex < resolvedWindowIds.length
    ) {
      const activeWindowFromIndex = resolvedWindowIds[activeWindowIndex];
      const currentState = useDesktopStore.getState();

      if (
        activeWindowFromIndex &&
        currentState.activeWindowId !== activeWindowFromIndex
      ) {
        focusWindow(activeWindowFromIndex);
      }
      return;
    }

    if (activeApp) {
      const currentState = useDesktopStore.getState();
      const activeWindowByApp = currentState.windows.find(w => w.component === activeApp);
      if (activeWindowByApp && currentState.activeWindowId !== activeWindowByApp.id) {
        focusWindow(activeWindowByApp.id);
      }
    }
  }, [location.pathname, location.search, openWindow, focusWindow]);

  // Initial URL sync on mount
  useEffect(() => {
    if (skipNextSyncFromUrlRef.current) {
      skipNextSyncFromUrlRef.current = false;
      return;
    }

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
};
