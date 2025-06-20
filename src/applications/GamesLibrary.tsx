import React, { useState, useEffect, useMemo } from 'react'
import { Search, Play, Star, Monitor, Trophy, ChevronLeft, ChevronRight, Gamepad2, Smartphone, Tv } from 'lucide-react'

interface Game {
  Game: string
  Platform: string
  Genre: string
  Rating: number
  Played: string
  IGDB: string
  Completed: string
  'Quick Review': string
  Notes: string
  GOTY: string
}

interface SortConfig {
  key: keyof Game | null
  direction: 'asc' | 'desc'
}

export const GamesLibrary: React.FC = () => {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('All')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Played', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  
  const itemsPerPage = 20

  // Load and parse CSV data
  useEffect(() => {
    const loadGames = async () => {
      try {
        const response = await fetch('/games.csv')
        const csvText = await response.text()
        
        // Parse CSV (basic implementation)
        const lines = csvText.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',')
        
        const parsedGames: Game[] = lines.slice(1).map(line => {
          // Handle CSV parsing with quotes and commas
          const values: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          values.push(current.trim()) // Add the last value
          
          const game: Record<string, string | number> = {}
          headers.forEach((header, index) => {
            game[header.trim()] = values[index] || ''
          })
          
          // Convert rating to number
          game.Rating = parseInt(String(game.Rating)) || 0
          
          return game as unknown as Game
        })
        
        setGames(parsedGames)
      } catch (error) {
        console.error('Failed to load games:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadGames()
  }, [])

  // Get unique genres and platforms for filters
  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(games.map(game => game.Genre).filter(Boolean))]
    return ['All', ...uniqueGenres.sort()]
  }, [games])

  const platforms = useMemo(() => {
    const uniquePlatforms = [...new Set(games.map(game => game.Platform).filter(Boolean))]
    return ['All', ...uniquePlatforms.sort()]
  }, [games])

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    const filtered = games.filter(game => {
      const matchesSearch = game.Game.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGenre = selectedGenre === 'All' || game.Genre === selectedGenre
      const matchesPlatform = selectedPlatform === 'All' || game.Platform === selectedPlatform
      return matchesSearch && matchesGenre && matchesPlatform
    })

    // Sort games
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        
        if (sortConfig.key === 'Rating') {
          return sortConfig.direction === 'asc' 
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number)
        }
        
        if (sortConfig.key === 'Played') {
          const aDate = new Date(aValue as string).getTime()
          const bDate = new Date(bValue as string).getTime()
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
        }
        
        return sortConfig.direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue))
      })
    }

    return filtered
  }, [games, searchTerm, selectedGenre, selectedPlatform, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedGames.length / itemsPerPage)
  const paginatedGames = filteredAndSortedGames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get the earliest date for "since" display
  const earliestDate = useMemo(() => {
    if (games.length === 0) return null
    
    const validDates = games
      .map(game => new Date(game.Played))
      .filter(date => !isNaN(date.getTime()))
    
    if (validDates.length === 0) return null
    
    return new Date(Math.min(...validDates.map(date => date.getTime())))
  }, [games])

  const handleSort = (key: keyof Game) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setCurrentPage(1)
  }

  const handleGameClick = (game: Game) => {
    setSelectedGame(game)
  }

  const getRatingColor = (rating: number) => {
    // Create a gradient from red (0) to yellow (7) to green (10)
    if (rating <= 0) return '#dc2626' // Red
    if (rating >= 10) return '#16a34a' // Green
    
    if (rating <= 7) {
      // Interpolate from red to yellow (0-7)
      const ratio = rating / 7
      const red = Math.round(220 - (220 - 234) * ratio) // 220 (dc) to 234 (ea)
      const green = Math.round(38 + (179 - 38) * ratio)  // 38 (26) to 179 (b3)
      const blue = Math.round(38 - 38 * ratio)           // 38 (26) to 0 (00)
      return `rgb(${red}, ${green}, ${blue})`
    } else {
      // Interpolate from yellow to green (7-10)
      const ratio = (rating - 7) / 3
      const red = Math.round(234 - 212 * ratio)   // 234 (ea) to 22 (16)
      const green = Math.round(179 + 84 * ratio)  // 179 (b3) to 163 (a3)
      const blue = Math.round(0 + 74 * ratio)     // 0 (00) to 74 (4a)
      return `rgb(${red}, ${green}, ${blue})`
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'pc':
      case 'windows':
      case 'steam':
        return <Monitor size={14} />
      case 'playstation':
      case 'ps4':
      case 'ps5':
      case 'playstation 4':
      case 'playstation 5':
        return <Gamepad2 size={14} />
      case 'xbox':
      case 'xbox one':
      case 'xbox series x':
      case 'xbox series s':
        return <Gamepad2 size={14} />
      case 'nintendo switch':
      case 'switch':
        return <Gamepad2 size={14} />
      case 'mobile':
      case 'android':
      case 'ios':
      case 'iphone':
        return <Smartphone size={14} />
      case 'tv':
      case 'smart tv':
        return <Tv size={14} />
      default:
        return <Monitor size={14} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--color-accent-500)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading games library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--window-content-bg)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--window-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} style={{ color: 'var(--color-accent-500)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Games Library
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm px-2 py-1 rounded" style={{ 
                backgroundColor: 'var(--color-accent-100)', 
                color: 'var(--color-accent-700)' 
              }}>
                {filteredAndSortedGames.length} games
              </span>
              {earliestDate && (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  since {earliestDate.getFullYear()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                style={{
                  backgroundColor: 'var(--window-bg)',
                  borderColor: 'var(--window-border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
          
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              backgroundColor: 'var(--window-bg)',
              borderColor: 'var(--window-border)',
              color: 'var(--text-primary)'
            }}
          >
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          
          <select
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border rounded-lg"
            style={{
              backgroundColor: 'var(--window-bg)',
              borderColor: 'var(--window-border)',
              color: 'var(--text-primary)'
            }}
          >
            {platforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Games Content - List View Only */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 p-3 text-xs font-medium border-b" style={{ 
            backgroundColor: 'var(--color-primary-100)', 
            color: 'var(--text-secondary)',
            borderColor: 'var(--window-border)'
          }}>
            <div className="col-span-4">
              <button 
                onClick={() => handleSort('Game')}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Game
                {sortConfig.key === 'Game' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button 
                onClick={() => handleSort('Platform')}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Platform
                {sortConfig.key === 'Platform' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button 
                onClick={() => handleSort('Genre')}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Genre
                {sortConfig.key === 'Genre' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
            <div className="col-span-1">
              <button 
                onClick={() => handleSort('Rating')}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Rating
                {sortConfig.key === 'Rating' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button 
                onClick={() => handleSort('Played')}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Played
                {sortConfig.key === 'Played' && (
                  <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
            <div className="col-span-1">Status</div>
          </div>

          {/* List Items */}
          {paginatedGames.map((game, index) => (
            <div
              key={`${game.Game}-${index}`}
              onClick={() => handleGameClick(game)}
              className="grid grid-cols-12 gap-4 p-3 border rounded cursor-pointer hover:shadow-md transition-all group"
              style={{
                backgroundColor: 'var(--window-bg)',
                borderColor: 'var(--window-border)',
              }}
            >
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded flex items-center justify-center group-hover:opacity-80 transition-opacity"
                     style={{ backgroundColor: 'var(--color-primary-200)' }}>
                  {getPlatformIcon(game.Platform)}
                </div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{game.Game}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                {getPlatformIcon(game.Platform)}
                {game.Platform}
              </div>
              <div className="col-span-2 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                {game.Genre}
              </div>
              <div className="col-span-1 flex items-center">
                <div 
                  className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                  style={{ 
                    backgroundColor: getRatingColor(game.Rating),
                    color: 'white'
                  }}
                >
                  <Star size={10} />
                  {game.Rating}/10
                </div>
              </div>
              <div className="col-span-2 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                {new Date(game.Played).toLocaleDateString()}
              </div>
              <div className="col-span-1 flex items-center">
                <span className={`px-2 py-1 rounded text-xs ${
                  game.Completed === 'TRUE' ? 'bg-green-100 text-green-700' : 
                  game.Completed === 'FALSE' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {game.Completed === 'TRUE' ? '✓' : game.Completed === 'FALSE' ? '○' : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--window-border)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedGames.length)} of {filteredAndSortedGames.length} games
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition-colors"
              style={{
                backgroundColor: 'var(--window-bg)',
                borderColor: 'var(--window-border)',
                color: 'var(--text-primary)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="px-3 py-1 text-sm" style={{ color: 'var(--text-primary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition-colors"
              style={{
                backgroundColor: 'var(--window-bg)',
                borderColor: 'var(--window-border)',
                color: 'var(--text-primary)'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Game Detail Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedGame(null)}>
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-auto"
            style={{ backgroundColor: 'var(--window-bg)', color: 'var(--text-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-4">{selectedGame.Game}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Platform:</span> {selectedGame.Platform}
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Genre:</span> {selectedGame.Genre}
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Rating:</span> 
                  <span 
                    className="ml-2 px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1"
                    style={{ 
                      backgroundColor: getRatingColor(selectedGame.Rating),
                      color: 'white'
                    }}
                  >
                    <Star size={10} />
                    {selectedGame.Rating}/10
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Played:</span> {new Date(selectedGame.Played).toLocaleDateString()}
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Completed:</span> {
                    selectedGame.Completed === 'TRUE' ? '✓ Yes' : 
                    selectedGame.Completed === 'FALSE' ? '○ No' : '— N/A'
                  }
                </div>
                {selectedGame.GOTY && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>GOTY:</span> 
                    <span style={{ color: 'var(--color-accent-600)' }}> {selectedGame.GOTY}</span>
                  </div>
                )}
              </div>
            </div>
            
            {selectedGame['Quick Review'] && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Review:</h3>
                <p className="text-sm leading-relaxed">{selectedGame['Quick Review']}</p>
              </div>
            )}
            
            {selectedGame.Notes && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Notes:</h3>
                <p className="text-sm leading-relaxed">{selectedGame.Notes}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <button
                className="px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-accent-500)',
                  color: 'white'
                }}
                onClick={() => {
                  // Simulate "launching" the game
                  alert(`Launching ${selectedGame.Game}... (Just kidding! 🎮)`)
                }}
              >
                <Play size={16} />
                Launch Game
              </button>
              
              <button
                onClick={() => setSelectedGame(null)}
                className="px-4 py-2 rounded border transition-colors"
                style={{
                  backgroundColor: 'var(--window-bg)',
                  borderColor: 'var(--window-border)',
                  color: 'var(--text-primary)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
