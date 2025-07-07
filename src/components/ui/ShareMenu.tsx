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
    const url = getShareableUrl(windows, activeWindowId);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWindowUrl = async () => {
    if (!window) return;
    const url = getShareableWindowUrl(window);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="share-menu fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-48"
      style={{
        left: Math.min(position.x, globalThis.innerWidth - 200),
        top: Math.min(position.y, globalThis.innerHeight - 150),
      }}
    >
      <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
        <Share2 className="inline w-4 h-4 mr-2" />
        Share {window ? 'Window' : 'Desktop'}
      </div>
      
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
