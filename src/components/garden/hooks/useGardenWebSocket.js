import { useEffect, useRef, useState } from 'react';
import { getAuthToken, initializeAuthToken } from '../../../services/api/client';
import { GARDEN_CONFIG } from '../../../config/gardenConfig.js';

const WS_URL = process.env.NODE_ENV === 'production'
  ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/garden/ws'
  : 'ws://localhost:8080/garden/ws';

// Get timing configuration from centralized config
const REFRESH_INTERVAL_MS = GARDEN_CONFIG.timing.refreshIntervalMs;
const MAX_IDLE_TIME = GARDEN_CONFIG.timing.maxIdleTimeMs;

const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  return isVisible;
};

export function useGardenWebSocket() {
  const [token, setToken] = useState(null);
  const [garden, setGarden] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenFetched, setTokenFetched] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [rateLimited, setRateLimited] = useState(false);
  
  const wsRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const rateLimitTimeoutRef = useRef(null);
  const isVisible = usePageVisibility();

  useEffect(() => {
    if (tokenFetched) return;
    setTokenFetched(true);
    
    getAuthToken()
      .then(authToken => {
        setToken(authToken);
        setIsLoading(false);
      })
      .catch(err => {
        setError(`Could not get access token: ${err.message}`);
        setIsLoading(false);
      });
  }, []);

  // Connect to WebSocket when token is ready
  useEffect(() => {
    if (!token || wsRef.current) return;
    
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY_MS = 2000;
    
    // Create WebSocket connection
    const ws = new window.WebSocket(WS_URL + '?token=' + token);
    wsRef.current = ws;
    
    // Handle connection opened
    ws.onopen = () => {
      setError(null);
      reconnectAttempts = 0;
      
      // Start periodic state refresh with activity-based optimization
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      refreshIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const now = Date.now();
          const timeSinceActivity = now - lastActivityRef.current;
          
          // Only refresh if user has been active recently AND tab is visible
          if (timeSinceActivity < MAX_IDLE_TIME && isVisible) {
            try {
              ws.send(JSON.stringify({ type: 'action', action: 'refresh' }));
            } catch (err) {
              console.error('Error sending refresh:', err);
            }
          }
        }
      }, REFRESH_INTERVAL_MS);
    };

    // Handle incoming messages
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'init' || msg.type === 'update') {
        setGarden(msg.state);
        if (msg.communityStats) {
          setCommunityStats(msg.communityStats);
        }
      }
      if (msg.type === 'error') {
        // Handle rate limiting gracefully without clearing content
        if (msg.error && msg.error.toLowerCase().includes('rate limit')) {
          // Clear any existing rate limit timeout
          if (rateLimitTimeoutRef.current) {
            clearTimeout(rateLimitTimeoutRef.current);
          }
          
          setRateLimited(true);
          
          // Re-enable buttons after 3 seconds
          rateLimitTimeoutRef.current = setTimeout(() => {
            setRateLimited(false);
            rateLimitTimeoutRef.current = null;
          }, 3000);
        } else {
          setError(msg.error);
        }
      }
      if (msg.type === 'ack') {
        // Clear loading state for this action
        setActionLoading(prev => ({ ...prev, [msg.action]: false }));
      }
    };
    
    // Handle connection errors
    ws.onerror = () => {
      setError('WebSocket connection failed');
      
      // Attempt to reconnect without forcing token refresh unless it's an auth error
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
          if (wsRef.current) {
            try { wsRef.current.close(); } catch(e) {}
          }
          wsRef.current = null;
          // Don't force token refresh on network errors
        }, RECONNECT_DELAY_MS);
      }
    };
    
    // Handle connection closed
    ws.onclose = (e) => {
      // Clear refresh interval on disconnect
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      // Handle different close codes appropriately
      if (e.code === 4002) {
        // Invalid token - force token refresh
        setError('Authentication failed. Refreshing token...');
        setTokenFetched(false);
      } else if (e.code !== 1000) {
        // Other errors - don't force token refresh
        setError('Connection lost: ' + (e.reason || 'Please wait...'));
      }
      
      // Attempt to reconnect for non-auth errors
      if (e.code !== 4002 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
          if (wsRef.current) {
            try { wsRef.current.close(); } catch(e) {}
          }
          wsRef.current = null;
          // Only force token refresh on auth errors
        }, RECONNECT_DELAY_MS);
      }
    };
    
    return () => {
      // Cleanup rate limit timeout
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
        rateLimitTimeoutRef.current = null;
      }
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token]);

  // Send action to server with loading state
  function sendAction(action, extra = {}) {
    if (actionLoading[action] || rateLimited || !wsRef.current || wsRef.current.readyState !== 1) return;
    
    // Update activity timestamp
    lastActivityRef.current = Date.now();
    
    // Set loading state for this action
    setActionLoading(prev => ({ ...prev, [action]: true }));
    
    // Safety timeout to clear loading state if no response in 10 seconds
    setTimeout(() => {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }, 10000);
    
    wsRef.current.send(JSON.stringify({ type: 'action', action, ...extra }));
  }

  // Handle button clicks with explicit event prevention
  function handleAction(event, action, extra = {}) {
    event.preventDefault();
    event.stopPropagation();
    
    if (rateLimited || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    
    // Update activity timestamp
    lastActivityRef.current = Date.now();
    
    setTimeout(() => sendAction(action, extra), 0);
    return false;
  }

  return {
    garden,
    communityStats,
    error,
    isLoading,
    actionLoading,
    rateLimited,
    handleAction
  };
}
