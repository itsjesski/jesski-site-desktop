import React, { useState, useEffect } from 'react';
import { apiCall, API_ENDPOINTS } from '../api/client';

interface ServerInfo {
  status: string;
  timestamp: string;
}

export const ServerStatus: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await apiCall(API_ENDPOINTS.health);
        setServerInfo(response);
        setStatus('connected');
      } catch (error) {
        console.error('Server health check failed:', error);
        setStatus('disconnected');
      }
    };

    checkServerHealth();
    
    // Check server health every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Server Connected';
      case 'disconnected': return 'Server Offline';
      default: return 'Checking...';
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
      <span className={getStatusColor()}>{getStatusText()}</span>
      {status === 'connected' && serverInfo?.timestamp && (
        <span className="text-gray-500">
          ({new Date(serverInfo.timestamp).toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};
