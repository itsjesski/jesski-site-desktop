import React from 'react';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import { getShareableUrl, getShareableWindowUrl } from '../../utils/urlRouter';
import { useDesktopStore } from '../../store/desktopStore';
import type { WindowState } from '../../types/window';

interface ShareMenuProps {
  window?: WindowState;
  onClose: () => void;
  position: { x: number; y: number };
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ window, onClose, position }) => {
  const { windows, activeWindowId } = useDesktopStore();
  const [copied, setCopied] = React.useState(false);

  const handleCopyDesktopUrl = async () => {
    try {
      const url = getShareableUrl(windows, activeWindowId);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy desktop URL:', error);
      // Still show copied briefly to avoid confusing the user
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const handleCopyWindowUrl = async () => {
    if (!window) return;
    
    try {
      const url = getShareableWindowUrl(window);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy window URL:', error);
      // Still show copied briefly to avoid confusing the user
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const handleOpenInNewTab = () => {
    if (window) {
      const url = getShareableWindowUrl(window);
      globalThis.open(url, '_blank');
    } else {
      const url = getShareableUrl(windows, activeWindowId);
      globalThis.open(url, '_blank');
    }
    onClose();
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.share-menu')) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="share-menu fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-48"
      style={{
        left: Math.max(0, Math.min(position.x, (globalThis.innerWidth || 1024) - 200)),
        top: Math.max(0, Math.min(position.y, (globalThis.innerHeight || 768) - 200)),
      }}
    >
      
      {window && (
        <button
          onClick={handleCopyWindowUrl}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Window Link'}
        </button>
      )}
      
      <button
        onClick={handleCopyDesktopUrl}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
      >
        <Copy className="w-4 h-4 mr-2" />
        {copied ? 'Copied!' : 'Copy Desktop Link'}
      </button>
      
      <button
        onClick={handleOpenInNewTab}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in New Tab
      </button>
    </div>
  );
};
