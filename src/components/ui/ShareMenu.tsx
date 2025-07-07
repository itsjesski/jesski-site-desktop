import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
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
  const [clipboardBlocked, setClipboardBlocked] = React.useState(false);

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
      // Check if it's likely a clipboard permission issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (error instanceof DOMException || errorMessage.includes('clipboard') || errorMessage.includes('permission')) {
        setClipboardBlocked(true);
        setTimeout(() => setClipboardBlocked(false), 3000);
      } else {
        // Still show copied briefly to avoid confusing the user
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }
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
      // Check if it's likely a clipboard permission issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (error instanceof DOMException || errorMessage.includes('clipboard') || errorMessage.includes('permission')) {
        setClipboardBlocked(true);
        setTimeout(() => setClipboardBlocked(false), 3000);
      } else {
        // Still show copied briefly to avoid confusing the user
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }
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
      if (!target.closest('.jesski-dropdown')) {
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
      className="jesski-dropdown fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-48"
      style={{
        left: Math.max(0, Math.min(position.x, (globalThis.innerWidth || 1024) - 200)),
        top: Math.max(0, Math.min(position.y, (globalThis.innerHeight || 768) - 200)),
      }}
      role="menu"
      aria-label="Share options"
    >
      
      {window && (
        <button
          onClick={handleCopyWindowUrl}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
          role="menuitem"
        >
          <Copy className="w-4 h-4 mr-2" />
          {clipboardBlocked ? 'Clipboard Blocked' : copied ? 'Copied!' : 'Copy Window URL'}
        </button>
      )}
      
      <button
        onClick={handleCopyDesktopUrl}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
        role="menuitem"
      >
        <Copy className="w-4 h-4 mr-2" />
        {clipboardBlocked ? 'Clipboard Blocked' : copied ? 'Copied!' : 'Copy Desktop URL'}
      </button>
      
      {clipboardBlocked && (
        <div className="px-3 py-2 text-xs text-orange-600 bg-orange-50 border-t border-orange-200">
          <strong>Ad blocker detected:</strong> Please disable uBlock Origin or allow clipboard access for this site.
        </div>
      )}
      
      <button
        onClick={handleOpenInNewTab}
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
        role="menuitem"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in New Tab
      </button>
    </div>
  );
};
