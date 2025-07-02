import React, { useState, useEffect } from 'react'
import { Monitor, Video, Mic, MicOff, VideoOff, Settings, Play, Square, Camera, Volume2, VolumeX } from 'lucide-react'
import { twitchAPI, type TwitchStreamData } from '../services/api/twitchAPIClient'
import type { StreamerSoftwareProps } from '../types/streamer'

export const StreamerSoftware: React.FC<StreamerSoftwareProps> = () => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [streamTime, setStreamTime] = useState(0)
  const [viewers, setViewers] = useState(42)
  const [twitchLive, setTwitchLive] = useState(false)
  const [twitchStreamData, setTwitchStreamData] = useState<TwitchStreamData | null>(null)

  const TWITCH_CHANNEL = 'jesski' // Replace with your actual Twitch channel name

  // Check Twitch live status
  useEffect(() => {
    const checkTwitchStatus = async () => {
      try {
        // Refresh connection before checking status
        await twitchAPI.refreshConnection()
        
        const status = await twitchAPI.isStreamLive(TWITCH_CHANNEL)
        setTwitchLive(status.isLive)
        setTwitchStreamData(status.streamData || null)
      } catch {
        // Silently fail - not critical for the app
      }
    }

    // Check immediately
    checkTwitchStatus()

    // Then check every 30 seconds
    const interval = setInterval(checkTwitchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Simulate stream timer
  useEffect(() => {
    let interval: number
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamTime(prev => prev + 1)
        // Randomly fluctuate viewer count when streaming
        if (Math.random() < 0.3) {
          setViewers(prev => Math.max(1, prev + Math.floor(Math.random() * 10 - 5)))
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStreaming])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartStream = () => {
    setIsStreaming(true)
    setStreamTime(0)
  }

  const handleStopStream = () => {
    setIsStreaming(false)
    setStreamTime(0)
    setViewers(42)
  }

  const scenes = [
    { id: '1', name: 'Gaming Scene', active: true },
    { id: '2', name: 'Just Chatting', active: false },
    { id: '3', name: 'BRB Screen', active: false },
    { id: '4', name: 'Starting Soon', active: false }
  ]

  const sources = [
    { id: '1', name: 'Game Capture', type: 'game', visible: true },
    { id: '2', name: 'Webcam', type: 'camera', visible: cameraEnabled },
    { id: '3', name: 'Microphone', type: 'audio', visible: micEnabled },
    { id: '4', name: 'Browser Source', type: 'browser', visible: true },
    { id: '5', name: 'Overlay', type: 'image', visible: true }
  ]

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
      {/* Top Menu Bar */}
      <div className="flex items-center justify-between p-2 border-b" style={{ borderColor: '#333333', backgroundColor: '#2d2d2d' }}>
        <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Monitor size={16} style={{ color: '#00ff00' }} />
            <span className="text-sm font-semibold hidden sm:inline">StreamerSoft Pro</span>
            <span className="text-sm font-semibold sm:hidden">StreamerSoft</span>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 text-sm min-w-0 overflow-hidden">
            <span style={{ color: '#888888' }} className="hidden sm:inline">Status:</span>
            <span style={{ color: twitchLive ? '#00ff00' : '#ff6666' }} className="flex-shrink-0">
              {twitchLive ? 'LIVE' : 'Offline'}
            </span>
            {twitchLive && twitchStreamData && (
              <>
                <span style={{ color: '#888888' }} className="hidden md:inline">•</span>
                <span style={{ color: '#00aaff' }} className="hidden sm:inline lg:inline flex-shrink-0">{twitchStreamData.viewer_count} viewers</span>
                <span style={{ color: '#888888' }} className="hidden lg:inline">•</span>
                <span style={{ color: '#ffaa00' }} className="hidden md:inline flex-shrink-0">{twitchStreamData.game_name || 'Just Chatting'}</span>
              </>
            )}
            {isStreaming && !twitchLive && (
              <>
                <span style={{ color: '#888888' }} className="hidden md:inline">•</span>
                <span style={{ color: '#00aaff' }} className="hidden sm:inline lg:inline flex-shrink-0">{viewers} viewers</span>
                <span style={{ color: '#888888' }} className="hidden lg:inline">•</span>
                <span style={{ color: '#ffaa00' }} className="hidden md:inline flex-shrink-0">{formatTime(streamTime)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="p-1 rounded hover:bg-gray-600"
            style={{ backgroundColor: 'transparent' }}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Preview Window */}
          <div className="flex-1 p-2 xl:p-4 min-h-0">
            <div className="w-full h-full rounded-lg relative overflow-hidden min-h-48" style={{ backgroundColor: '#000000' }}>
              {/* Twitch Embed or Offline Screen */}
              {twitchLive ? (
                <div className="absolute inset-0">
                  <iframe
                    src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${window.location.hostname}&autoplay=false&muted=true`}
                    className="w-full h-full"
                    allowFullScreen
                    title={`${TWITCH_CHANNEL} Twitch Stream`}
                  />
                  {/* Live indicator overlay */}
                  <div className="absolute top-2 xl:top-4 left-2 xl:left-4 px-2 xl:px-3 py-1 rounded text-xs xl:text-sm z-10" style={{ backgroundColor: 'rgba(255, 0, 0, 0.9)' }}>
                    <span className="text-white font-bold">🔴 LIVE</span>
                  </div>
                  {twitchStreamData && (
                    <div className="absolute top-2 xl:top-4 right-2 xl:right-4 px-2 xl:px-3 py-1 rounded text-xs xl:text-sm z-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                      <span className="text-white">{twitchStreamData.viewer_count} viewers</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 xl:w-32 xl:h-32 mx-auto mb-2 xl:mb-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#333333' }}>
                      <Monitor size={32} className="xl:w-12 xl:h-12" style={{ color: '#666666' }} />
                    </div>
                    <h3 className="text-lg xl:text-xl font-semibold mb-1 xl:mb-2">Stream Preview</h3>
                    <p className="text-sm xl:text-base mb-2" style={{ color: '#888888' }}>
                      Channel: @{TWITCH_CHANNEL}
                    </p>
                    <div className="px-3 py-1 rounded text-sm" style={{ backgroundColor: '#333333', color: '#ff6666' }}>
                      ⚫ OFFLINE
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-3 xl:p-4 border-t" style={{ borderColor: '#333333', backgroundColor: '#2d2d2d' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 xl:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 xl:gap-4">
                {/* Stream Controls */}
                <div className="flex items-center gap-2">
                  {!isStreaming ? (
                    <button
                      onClick={handleStartStream}
                      className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded font-semibold text-white transition-colors"
                      style={{ backgroundColor: '#ff4444' }}
                    >
                      <Play size={16} />
                      <span className="hidden sm:inline">Start Streaming</span>
                      <span className="sm:hidden">Start</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopStream}
                      className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded font-semibold text-white transition-colors"
                      style={{ backgroundColor: '#666666' }}
                    >
                      <Square size={16} />
                      <span className="hidden sm:inline">Stop Stream</span>
                      <span className="sm:hidden">Stop</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                      isRecording ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    {isRecording ? <Square size={16} /> : <Video size={16} />}
                    <span className="hidden sm:inline">{isRecording ? 'Stop Rec' : 'Record'}</span>
                    <span className="sm:hidden">{isRecording ? 'Stop' : 'Rec'}</span>
                  </button>
                </div>

                {/* Audio/Video Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMicEnabled(!micEnabled)}
                    className={`p-2 rounded transition-colors ${
                      micEnabled ? 'bg-gray-600' : 'bg-red-600'
                    }`}
                    title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>

                  <button
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    className={`p-2 rounded transition-colors ${
                      cameraEnabled ? 'bg-gray-600' : 'bg-red-600'
                    }`}
                    title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {cameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                  </button>

                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`p-2 rounded transition-colors ${
                      audioEnabled ? 'bg-gray-600' : 'bg-red-600'
                    }`}
                    title={audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                  >
                    {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Scenes & Sources (Hidden on small screens) */}
        <div className="hidden xl:block w-80 min-w-64 max-w-80 border-l" style={{ borderColor: '#333333', backgroundColor: '#252525' }}>
          {/* Scenes */}
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#ffffff' }}>Scenes</h3>
            <div className="space-y-1">
              {scenes.map(scene => (
                <div
                  key={scene.id}
                  className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                    scene.active ? 'bg-blue-600' : 'hover:bg-gray-600'
                  }`}
                  style={{ backgroundColor: scene.active ? '#0066cc' : 'transparent' }}
                >
                  {scene.name}
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="p-3 border-t" style={{ borderColor: '#333333' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#ffffff' }}>Sources</h3>
            <div className="space-y-1">
              {sources.map(source => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 p-2 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  <div className={`w-3 h-3 rounded flex-shrink-0 ${source.visible ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="flex-1 min-w-0 truncate">{source.name}</span>
                  {source.type === 'camera' && (
                    <Camera size={14} style={{ color: source.visible ? '#00ff00' : '#666666' }} className="flex-shrink-0" />
                  )}
                  {source.type === 'audio' && (
                    <Mic size={14} style={{ color: source.visible ? '#00ff00' : '#666666' }} className="flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
