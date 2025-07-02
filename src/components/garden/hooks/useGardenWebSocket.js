import { useEffect, useRef, useState } from 'react';

// WebSocket URL - connect directly to backend in development, use proxy in production
const WS_URL = process.env.NODE_ENV === 'production'
  ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/garden/ws'
  : 'ws://localhost:8080/garden/ws';

// Add visibility change detection to pause refreshing when tab is not visible
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
  const REFRESH_INTERVAL_MS = 3000; // Reduced frequency: refresh every 3 seconds
  const MAX_IDLE_TIME = 60000; // Stop refreshing after 1 minute of no user activity

  // Get ephemeral token on mount
  useEffect(() => {
    if (tokenFetched) return;
    setTokenFetched(true);
    
    fetch('/api/token', { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        setToken(data.token);
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
    
    const ws = new window.WebSocket(WS_URL + '?token=' + token);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setError(null);
      // Start periodic state refresh with activity-based optimization
      refreshIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const now = Date.now();
          const timeSinceActivity = now - lastActivityRef.current;
          
          // Only refresh if user has been active recently AND tab is visible
          if (timeSinceActivity < MAX_IDLE_TIME && isVisible) {
            ws.send(JSON.stringify({ type: 'action', action: 'refresh' }));
          }
        }
      }, REFRESH_INTERVAL_MS);
    };
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'init' || msg.type === 'update') setGarden(msg.state);
      if (msg.type === 'error') {
        // Handle rate limiting gracefully without clearing content
        if (msg.error && msg.error.toLowerCase().includes('rate limit')) {
          // Clear any existing rate limit timeout
          if (rateLimitTimeoutRef.current) {
            clearTimeout(rateLimitTimeoutRef.current);
          }
          
          setRateLimited(true);
          // Don't clear ALL loading states, just let them timeout naturally or get ack'd
          
          // Re-enable buttons after 3 seconds
          rateLimitTimeoutRef.current = setTimeout(() => {
            setRateLimited(false);
            rateLimitTimeoutRef.current = null;
          }, 3000);
          // Don't set error state for rate limits to keep content visible
        } else {
          setError(msg.error);
        }
      }
      if (msg.type === 'ack') {
        // Clear loading state for this action
        setActionLoading(prev => ({ ...prev, [msg.action]: false }));
      }
    };
    
    ws.onerror = () => setError('WebSocket connection failed');
    
    ws.onclose = (e) => {
      setError('Connection lost: ' + (e.reason || 'Please refresh'));
      // Clear refresh interval on disconnect
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
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
    error,
    isLoading,
    actionLoading,
    rateLimited,
    handleAction
  };
}
