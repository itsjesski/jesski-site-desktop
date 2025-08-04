import React, { useState, useEffect } from 'react'

interface Playlist {
  id: number
  name: string
  spotifyUrl: string
  description: string
}

// Helper function to convert Spotify share URL to embed URL
const getSpotifyEmbedUrl = (spotifyUrl: string): string => {
  // Extract playlist ID from URLs like: https://open.spotify.com/playlist/6oaTu508s9qQPAza0whow9?si=...
  const match = spotifyUrl.match(/\/playlist\/([a-zA-Z0-9]+)/)
  if (match && match[1]) {
    return `https://open.spotify.com/embed/playlist/${match[1]}`
  }
  // Fallback to original URL if parsing fails
  return spotifyUrl
}

const playlistsData = [
  { 
    name: "Playstation Dreams", 
    spotifyUrl: "https://open.spotify.com/playlist/6oaTu508s9qQPAza0whow9?si=30ae7dd263ad4121", 
    description: "FLOAT AWAY TO NOSTALGIA"
  },
  { 
    name: "Home is where the House is", 
    spotifyUrl: "https://open.spotify.com/playlist/1WWEvxVFxxDe9WD25O6lAL?si=8b33e3ce307147a0", 
    description: "HOUSE VIBES"
  },
  { 
    name: "Casually Dancing", 
    spotifyUrl: "https://open.spotify.com/playlist/0BrUTeS16aMkJ4iDMO2ytd?si=db587c48b82a4834", 
    description: "GET YOUR DANCE ON"
  },
  { 
    name: "Feel Yourself", 
    spotifyUrl: "https://open.spotify.com/playlist/58sAOJOy2wBE4j6L4NSi9x?si=c6034ff1615841a6", 
    description: "BREAKCORE FOR THE MIND"
  },
  { 
    name: "Dreaming in Breakcore", 
    spotifyUrl: "https://open.spotify.com/playlist/0fKcBQhK9fMKCZf2hAI0kZ?si=c52c3f6ac0b34fd8", 
    description: "BREAKCORE TO DREAM TO"
  },
  { 
    name: "Hey cutie, lets boogie.", 
    spotifyUrl: "https://open.spotify.com/playlist/5m9Sd3FLzjtMZ9bNlfkts3?si=fec1cced916c43e4", 
    description: "FOR THE CUTIES"
  },
  { 
    name: "You've done well, lets groove.", 
    spotifyUrl: "https://open.spotify.com/playlist/0gVAoNxgEHatg03VLTmIlC?si=92b5cde64b6b4fdd", 
    description: "CELEBRATE YOUR ACCOMPLISHMENTS"
  },
  { 
    name: "You're beautiful. Welcome to paradise!", 
    spotifyUrl: "https://open.spotify.com/playlist/7y4xw4Uu0q4vK4And48hdl?si=07f8d577090f4d84", 
    description: "BEAUTIFUL VIBES"
  },
  { 
    name: "You're not a burden.", 
    spotifyUrl: "https://open.spotify.com/playlist/4PuzjVIw4Pgtnxb27wYjR5?si=de5f4494158d4ca0", 
    description: "YOU ARE LOVED"
  },
{ 
    name: "Tag Walls, Punch Fascists", 
    spotifyUrl: "https://open.spotify.com/playlist/0t1g0AkbtVijlUeEmTWWdK?si=b43bb3a3671c4827", 
    description: "FIGHT FOR RIGHTS"
  }
]

// Generate playlists with auto-incremented IDs and sort alphabetically
const playlists: Playlist[] = playlistsData
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((playlist, index) => ({
    id: index + 1,
    ...playlist
  }))

const WinampDisplay: React.FC<{ selectedPlaylist: Playlist | null }> = ({ selectedPlaylist }) => {
  const [scrollOffset, setScrollOffset] = useState(0)
  const [visualizerBars, setVisualizerBars] = useState(Array(10).fill(0))

  // Animate visualizer bars
  useEffect(() => {
    const interval = setInterval(() => {
      setVisualizerBars(bars => bars.map(() => Math.random()))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Scroll text if too long
  useEffect(() => {
    if (!selectedPlaylist) return
    
    const playlistName = selectedPlaylist.name
    if (playlistName.length > 20) {
      const interval = setInterval(() => {
        setScrollOffset(offset => (offset + 1) % (playlistName.length + 5))
      }, 200)
      return () => clearInterval(interval)
    } else {
      setScrollOffset(0)
    }
  }, [selectedPlaylist])

  const getDisplayText = () => {
    if (!selectedPlaylist) return "SELECT PLAYLIST"
    
    const name = selectedPlaylist.name.toUpperCase()
    if (name.length <= 20) return name
    
    const extended = `${name}     `
    const start = scrollOffset % extended.length
    return (extended + extended).substring(start, start + 20)
  }

  return (
    <div className="winamp-display">
      <div className="display-screen">
        <div className="display-text">
          {getDisplayText()}
        </div>
        <div className="track-info">
          {selectedPlaylist && selectedPlaylist.description}
        </div>
      </div>
      <div className="visualizer">
        {visualizerBars.map((height, i) => (
          <div 
            key={i} 
            className="visualizer-bar"
            style={{ height: `${Math.max(2, height * 20)}px` }}
          />
        ))}
      </div>
    </div>
  )
}

const PlaylistSelector: React.FC<{
  playlists: Playlist[]
  selectedId: number | null
  onSelect: (playlist: Playlist) => void
}> = ({ playlists, selectedId, onSelect }) => {
  return (
    <div className="playlist-selector">
      <div className="playlist-header">PLAYLISTS</div>
      <div className="playlist-list">
        {playlists.map((playlist) => (
          <div 
            key={playlist.id}
            className={`playlist-item ${selectedId === playlist.id ? 'selected' : ''}`}
            onClick={() => onSelect(playlist)}
          >
            <span className="playlist-icon">
              {selectedId === playlist.id ? '▶' : '▷'}
            </span>
            <span className="playlist-name">{playlist.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SpotifyEmbed: React.FC<{ playlistUrl?: string }> = ({ playlistUrl }) => {
  if (!playlistUrl) {
    return (
      <div className="spotify-embed-container">
        <div className="no-playlist">
          <div className="no-playlist-text">
            ♪ Select a playlist to start listening
          </div>
        </div>
      </div>
    )
  }

  const embedUrl = getSpotifyEmbedUrl(playlistUrl)

  return (
    <div className="spotify-embed-container">
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Playlist"
      />
    </div>
  )
}

export const MusicApp: React.FC = () => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)

  // Select random playlist on mount
  useEffect(() => {
    if (playlists.length > 0) {
      const randomIndex = Math.floor(Math.random() * playlists.length)
      setSelectedPlaylist(playlists[randomIndex])
    }
  }, [])

  return (
    <div className="music-app">
      <div className="music-app-content">
        <div className="left-panel">
          <WinampDisplay selectedPlaylist={selectedPlaylist} />
          <PlaylistSelector 
            playlists={playlists}
            selectedId={selectedPlaylist?.id || null}
            onSelect={setSelectedPlaylist}
          />
        </div>
        <div className="right-panel">
          <SpotifyEmbed playlistUrl={selectedPlaylist?.spotifyUrl} />
        </div>
      </div>
    </div>
  )
}
