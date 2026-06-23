import React from 'react'
import { Play, SkipBack, SkipForward, ExternalLink, RefreshCw, Tv } from 'lucide-react'
import type { WindowState } from '../types/window'
import { twitchAPI, type TwitchClip } from '../services/api/twitchAPIClient'
import { useDesktopStore } from '../store/desktopStore'

interface TwitchClipsAppProps {
  window: WindowState
}

const CLIP_BATCH_SIZE = 20

const getEmbedParentParams = () => {
  const host = globalThis.window?.location.hostname || 'localhost'
  const parents = new Set([host, 'localhost', '127.0.0.1'])
  return Array.from(parents)
    .map((parent) => `parent=${encodeURIComponent(parent)}`)
    .join('&')
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const buildShuffled = (clips: TwitchClip[]): TwitchClip[] => {
  const copy = [...clips]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// muted=false + volume=1.0 requests sound. Safe because this URL is only ever
// set synchronously inside a click handler, satisfying browser autoplay policy.
const getPlayUrl = (clip: TwitchClip) =>
  `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clip.id)}&${getEmbedParentParams()}&autoplay=true&muted=false&volume=1.0`

export const TwitchClipsApp: React.FC<TwitchClipsAppProps> = ({ window }) => {
  const { updateWindowData } = useDesktopStore()

  const [playlist, setPlaylist] = React.useState<TwitchClip[]>([])
  const [index, setIndex] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)

  // Permanent iframe ref — src is set synchronously in click handlers to keep
  // the browser's user-activation window alive for unmuted autoplay.
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  const twitchChannel = (import.meta.env.VITE_TWITCH_CHANNEL || 'jesski').trim()
  const initialClipFromRoute = typeof window.data?.clip === 'string' ? window.data.clip : ''

  const currentClip = playlist[index] ?? null

  const fetchClips = React.useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await twitchAPI.getClips(twitchChannel, CLIP_BATCH_SIZE)
      if (response.error) setError(response.error)

      if (!Array.isArray(response.clips) || response.clips.length === 0) {
        setPlaylist([])
        if (!response.error) setError('No clips available for this channel right now.')
        return
      }

      const shuffled = buildShuffled(response.clips)
      if (initialClipFromRoute) {
        const deepIdx = shuffled.findIndex((c) => c.id === initialClipFromRoute)
        if (deepIdx > 0) {
          const [clip] = shuffled.splice(deepIdx, 1)
          shuffled.unshift(clip)
        }
      }

      setPlaylist(shuffled)
      setIndex(0)
      setIsPlaying(false)
      // Clear the iframe when reloading
      if (iframeRef.current) iframeRef.current.src = 'about:blank'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Twitch clips')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [initialClipFromRoute, twitchChannel])

  React.useEffect(() => { void fetchClips() }, [fetchClips])

  React.useEffect(() => {
    if (!currentClip || window.data?.clip === currentClip.id) return
    updateWindowData(window.id, { ...(window.data || {}), clip: currentClip.id })
  }, [currentClip, updateWindowData, window.data, window.id])

  // When the clip index changes, reset playing state and clear iframe
  React.useEffect(() => {
    setIsPlaying(false)
    if (iframeRef.current) iframeRef.current.src = 'about:blank'
  }, [index])

  const handlePlay = (clip: TwitchClip) => {
    if (iframeRef.current) {
      iframeRef.current.src = getPlayUrl(clip)
    }
    setIsPlaying(true)
  }

  const handleNext = () => {
    setIndex((i) => (i + 1) % playlist.length)
  }

  const handlePrev = () => {
    setIndex((i) => (i - 1 + playlist.length) % playlist.length)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchClips()
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3"
        style={{ backgroundColor: '#0e0e10', color: '#adadb8' }}>
        <Tv size={32} className="opacity-40" />
        <span className="text-sm">Loading clips…</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#0e0e10' }}>

      {error && (
        <div className="flex-shrink-0 px-3 py-1 text-xs text-center" style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      {/* Screen — fills all remaining space */}
      <div className="flex-1 min-h-0 relative">
        <iframe
          ref={iframeRef}
          src="about:blank"
          width="100%"
          height="100%"
          className="border-0 block absolute inset-0"
          title={currentClip?.title || 'Twitch Clip'}
          allow="autoplay; fullscreen; picture-in-picture"
          style={{ zIndex: isPlaying ? 1 : 0 }}
        />

        {/* Thumbnail overlay — sits on top when not playing */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
            style={{
              zIndex: 2,
              backgroundImage: currentClip?.thumbnail_url ? `url(${currentClip.thumbnail_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#0e0e10',
            }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />
            {currentClip ? (
              <div className="relative z-10 flex flex-col items-center gap-2">
                <p className="text-sm font-semibold px-4 leading-snug"
                  style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)', maxWidth: '26rem' }}>
                  {currentClip.title || 'Untitled Clip'}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {currentClip.creator_name} · {formatDuration(currentClip.duration)}
                </p>
                <button
                  onClick={() => handlePlay(currentClip)}
                  className="mt-1 flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-105"
                  style={{ width: '56px', height: '56px', backgroundColor: '#9146ff' }}
                  aria-label="Play"
                >
                  <Play size={24} fill="#fff" color="#fff" />
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-3">
                <Tv size={36} style={{ color: '#6b7280' }} />
                <p className="text-sm" style={{ color: '#6b7280' }}>No clips found.</p>
                <button onClick={() => { void handleRefresh() }}
                  className="px-4 py-2 rounded text-sm cursor-pointer"
                  style={{ backgroundColor: '#374151', color: '#f9fafb' }}>
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remote bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3"
        style={{ backgroundColor: '#18181b', borderTop: '1px solid #2d2d35', paddingTop: '10px', paddingBottom: '25px' }}>

        {/* Prev */}
        <button onClick={handlePrev} disabled={playlist.length < 2}
          className="flex-shrink-0 p-1.5 rounded-full cursor-pointer disabled:opacity-30"
          style={{ color: '#efeff1', backgroundColor: '#2d2d35' }}
          title="Previous" aria-label="Previous">
          <SkipBack size={16} />
        </button>

        {/* Play */}
        <button
          onClick={() => currentClip && handlePlay(currentClip)}
          disabled={!currentClip || isPlaying}
          className="flex-shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-105 disabled:opacity-30 disabled:cursor-default disabled:scale-100"
          style={{ width: '40px', height: '40px', backgroundColor: '#9146ff' }}
          title={isPlaying ? 'Playing…' : 'Play'} aria-label="Play">
          <Play size={18} fill="#fff" color="#fff" />
        </button>

        {/* Next */}
        <button onClick={handleNext} disabled={playlist.length < 2}
          className="flex-shrink-0 p-1.5 rounded-full cursor-pointer disabled:opacity-30"
          style={{ color: '#efeff1', backgroundColor: '#2d2d35' }}
          title="Next" aria-label="Next">
          <SkipForward size={16} />
        </button>

        {/* Info — truncates to fill remaining space */}
        <div className="flex-1 min-w-0 px-1">
          <p className="text-xs font-medium truncate" style={{ color: '#efeff1' }}>
            {currentClip?.title || 'No clip loaded'}
          </p>
          <p className="text-xs truncate" style={{ color: '#adadb8' }}>
            {currentClip
              ? `${currentClip.creator_name} · ${formatDuration(currentClip.duration)}`
              : twitchChannel}
          </p>
        </div>

        {/* Utility buttons */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <button onClick={() => { void handleRefresh() }} disabled={isRefreshing}
            className="p-1.5 rounded cursor-pointer"
            style={{ color: '#adadb8' }} title="Reload clips">
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          {currentClip && (
            <a href={currentClip.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded" style={{ color: '#adadb8' }} title="Open on Twitch">
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
