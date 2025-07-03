import React, { useState, useEffect, useMemo } from 'react'
import { Search, Play, Star, Monitor, Trophy, ChevronLeft, ChevronRight, Gamepad2, Smartphone, Tv, BarChart3, Award, Target, Zap, Calendar } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<'games' | 'stats'>('games')
  const [windowWidth, setWindowWidth] = useState(1000)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  const itemsPerPage = 20

  // Track container width for responsive columns
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      // Get the actual content area width (subtract padding)
      const contentArea = container.querySelector('.games-content-area')
      if (contentArea) {
        setWindowWidth(contentArea.clientWidth)
      } else {
        // Fallback to container width minus padding
        setWindowWidth(container.clientWidth - 32) // Account for 16px padding on each side
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      updateWidth()
    })

    resizeObserver.observe(container)
    
    // Set initial width
    updateWidth()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Determine which columns to show based on width
  // More conservative breakpoints to ensure proper column dropping
  const showStatus = windowWidth >= 950    // Drop status first at narrower widths
  const showPlayed = windowWidth >= 800    // Drop played date next
  const showGenre = windowWidth >= 650     // Drop genre next  
  const showPlatform = windowWidth >= 500  // Drop platform last (before only game + rating remain)

  // Load and parse CSV data
  useEffect(() => {
    const loadGames = async () => {
      try {
        const response = await fetch('/data/games.csv')
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

  // Calculate stats
  const gameStats = useMemo(() => {
    if (games.length === 0) return null

    const totalGames = games.length
    const completedGames = games.filter(game => {
      if (!game.Completed) return false
      const completed = game.Completed.toLowerCase().trim()
      // Check for various ways "completed" might be indicated
      return completed === 'yes' || completed === 'y' || completed === 'true' || 
             completed === 'completed' || completed === 'done' || completed === '1'
    }).length
    
    const ratedGames = games.filter(game => game.Rating > 0)
    const averageRating = ratedGames.length > 0 
      ? ratedGames.reduce((sum, game) => sum + game.Rating, 0) / ratedGames.length
      : 0

    // Get GOTY winners
    const gotyWinners = games.filter(game => 
      game.GOTY && game.GOTY.toLowerCase() === 'yes'
    )

    // Random best and worst games (from rated games)
    const bestGames = ratedGames.filter(game => game.Rating >= 9)
    const worstGames = ratedGames.filter(game => game.Rating <= 4)
    
    const randomBestGame = bestGames.length > 0 
      ? bestGames[Math.floor(Math.random() * bestGames.length)]
      : null
    
    const randomWorstGame = worstGames.length > 0 
      ? worstGames[Math.floor(Math.random() * worstGames.length)]
      : null

    // Platform breakdown
    const platformStats = games.reduce((acc, game) => {
      const platform = game.Platform || 'Unknown'
      acc[platform] = (acc[platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Genre breakdown
    const genreStats = games.reduce((acc, game) => {
      const genre = game.Genre || 'Unknown'
      acc[genre] = (acc[genre] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Rating distribution
    const ratingDistribution = ratedGames.reduce((acc, game) => {
      const rating = Math.floor(game.Rating)
      acc[rating] = (acc[rating] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // Time-based stats
    const currentYear = new Date().getFullYear()
    const thisYearGames = games.filter(game => {
      const playedDate = new Date(game.Played)
      return !isNaN(playedDate.getTime()) && playedDate.getFullYear() === currentYear
    }).length

    return {
      totalGames,
      completedGames,
      completionRate: totalGames > 0 ? (completedGames / totalGames) * 100 : 0,
      averageRating: Number(averageRating.toFixed(1)),
      ratedGames: ratedGames.length,
      gotyWinners,
      randomBestGame,
      randomWorstGame,
      platformStats,
      genreStats,
      ratingDistribution,
      thisYearGames,
      earliestYear: earliestDate?.getFullYear() || currentYear
    }
  }, [games, earliestDate])

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
    <div ref={containerRef} className="h-full flex flex-col games-library-container" style={{ backgroundColor: 'var(--window-content-bg)' }}>
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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'games' 
                ? 'text-white' 
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeTab === 'games' 
                ? 'var(--color-accent-500)' 
                : 'var(--color-accent-100)',
              color: activeTab === 'games' 
                ? 'white' 
                : 'var(--color-accent-700)'
            }}
          >
            <div className="flex items-center gap-2">
              <Play size={16} />
              Games
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'stats' 
                ? 'text-white' 
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeTab === 'stats' 
                ? 'var(--color-accent-500)' 
                : 'var(--color-accent-100)',
              color: activeTab === 'stats' 
                ? 'white' 
                : 'var(--color-accent-700)'
            }}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              Stats
            </div>
          </button>
        </div>

        {/* Search and Filters - Only show on Games tab */}
        {activeTab === 'games' && (
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
        )}
      </div>

      {/* Main Content */}
      {activeTab === 'games' ? (
        <>
          {/* Games Content - Table View */}
          <div className="flex-1 overflow-auto games-content-area">
        <table className="w-full border-collapse" style={{ minWidth: '600px' }}>
          <thead>
            <tr className="border-b-2" style={{ 
              backgroundColor: 'var(--color-primary-100)', 
              borderColor: 'var(--window-border)'
            }}>
              <th className="text-left p-3 font-medium text-xs" style={{ 
                color: 'var(--text-secondary)',
                minWidth: '200px',
                width: '40%'
              }}>
                <button 
                  onClick={() => handleSort('Game')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                  style={{ color: 'inherit' }}
                >
                  Game
                  {sortConfig.key === 'Game' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              {showPlatform && (
                <th className="text-center p-3 font-medium text-xs" style={{ 
                  color: 'var(--text-secondary)',
                  minWidth: '100px',
                  width: '15%'
                }}>
                  <button 
                    onClick={() => handleSort('Platform')}
                    className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                    style={{ color: 'inherit' }}
                  >
                    Platform
                    {sortConfig.key === 'Platform' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              )}
              {showGenre && (
                <th className="text-center p-3 font-medium text-xs" style={{ 
                  color: 'var(--text-secondary)',
                  minWidth: '120px',
                  width: '15%'
                }}>
                  <button 
                    onClick={() => handleSort('Genre')}
                    className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                    style={{ color: 'inherit' }}
                  >
                    Genre
                    {sortConfig.key === 'Genre' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              )}
              <th className="text-center p-3 font-medium text-xs" style={{ 
                color: 'var(--text-secondary)',
                minWidth: '80px',
                width: '10%'
              }}>
                <button 
                  onClick={() => handleSort('Rating')}
                  className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                  style={{ color: 'inherit' }}
                >
                  Rating
                  {sortConfig.key === 'Rating' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              {showPlayed && (
                <th className="text-center p-3 font-medium text-xs" style={{ 
                  color: 'var(--text-secondary)',
                  minWidth: '100px',
                  width: '12%'
                }}>
                  <button 
                    onClick={() => handleSort('Played')}
                    className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                    style={{ color: 'inherit' }}
                  >
                    Played
                    {sortConfig.key === 'Played' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
              )}
              {showStatus && (
                <th className="text-center p-3 font-medium text-xs" style={{ 
                  color: 'var(--text-secondary)',
                  minWidth: '60px',
                  width: '8%'
                }}>
                  Status
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedGames.map((game, index) => (
              <tr
                key={`${game.Game}-${index}`}
                onClick={() => handleGameClick(game)}
                className="border-b cursor-pointer hover:shadow-sm transition-all group hover:bg-opacity-50"
                style={{
                  backgroundColor: 'var(--window-bg)',
                  borderColor: 'var(--window-border)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--window-bg)'
                }}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center group-hover:opacity-80 transition-opacity flex-shrink-0"
                         style={{ backgroundColor: 'var(--color-primary-200)' }}>
                      {getPlatformIcon(game.Platform)}
                    </div>
                    <span 
                      className="font-medium" 
                      style={{ 
                        color: 'var(--text-primary)',
                        wordBreak: 'break-word',
                        hyphens: 'auto',
                        lineHeight: '1.3'
                      }}
                      title={game.Game}
                    >
                      {game.Game}
                    </span>
                  </div>
                </td>
                {showPlatform && (
                  <td className="p-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex-shrink-0">{getPlatformIcon(game.Platform)}</div>
                      <span className="text-sm" title={game.Platform}>{game.Platform}</span>
                    </div>
                  </td>
                )}
                {showGenre && (
                  <td className="p-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-sm" title={game.Genre}>{game.Genre}</span>
                  </td>
                )}
                <td className="p-3 text-center">
                  <div 
                    className="px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1"
                    style={{ 
                      backgroundColor: getRatingColor(game.Rating),
                      color: 'white'
                    }}
                  >
                    <Star size={10} />
                    {game.Rating}/10
                  </div>
                </td>
                {showPlayed && (
                  <td className="p-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-sm">{new Date(game.Played).toLocaleDateString()}</span>
                  </td>
                )}
                {showStatus && (
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      game.Completed === 'TRUE' ? 'bg-green-100 text-green-700' : 
                      game.Completed === 'FALSE' ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {game.Completed === 'TRUE' ? '✓' : game.Completed === 'FALSE' ? '○' : '—'}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
        </>
      ) : (
        /* Stats Content */
        <div className="flex-1 overflow-auto p-6">
          {gameStats ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={20} style={{ color: 'var(--color-accent-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Total Games</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-accent-600)' }}>{gameStats.totalGames}</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={20} style={{ color: 'var(--color-green-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Completion Rate</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-green-600)' }}>
                    {gameStats.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {gameStats.completedGames} of {gameStats.totalGames} completed
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={20} style={{ color: 'var(--color-yellow-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Average Rating</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-yellow-600)' }}>
                    {gameStats.averageRating}/10
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {gameStats.ratedGames} games rated
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={20} style={{ color: 'var(--color-blue-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>This Year</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-blue-600)' }}>{gameStats.thisYearGames}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Games played in {new Date().getFullYear()}
                  </p>
                </div>
              </div>

              {/* Random Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameStats.randomBestGame && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-green-50)', border: '1px solid var(--color-green-200)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} style={{ color: 'var(--color-green-500)' }} />
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Random Great Game</h3>
                    </div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{gameStats.randomBestGame.Game}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Rating: {gameStats.randomBestGame.Rating}/10 • {gameStats.randomBestGame.Platform}
                    </p>
                  </div>
                )}

                {gameStats.randomWorstGame && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-red-50)', border: '1px solid var(--color-red-200)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} style={{ color: 'var(--color-red-500)' }} />
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Random Poor Game</h3>
                    </div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{gameStats.randomWorstGame.Game}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Rating: {gameStats.randomWorstGame.Rating}/10 • {gameStats.randomWorstGame.Platform}
                    </p>
                  </div>
                )}
              </div>

              {/* GOTY Winners */}
              {gameStats.gotyWinners.length > 0 && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={20} style={{ color: 'var(--color-gold-500)' }} />
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Game of the Year Winners</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gameStats.gotyWinners.map((game, index) => (
                      <div key={index} className="px-3 py-1 rounded text-sm" style={{ backgroundColor: 'var(--color-gold-100)', color: 'var(--color-gold-700)' }}>
                        {game.Game}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform & Genre Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Platform Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(gameStats.platformStats)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([platform, count]) => (
                        <div key={platform} className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{platform}</span>
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Top Genres</h3>
                  <div className="space-y-2">
                    {Object.entries(gameStats.genreStats)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([genre, count]) => (
                        <div key={genre} className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{genre}</span>
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Rating Distribution</h3>
                <div className="flex items-end justify-center gap-1" style={{ height: '120px' }}>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(rating => {
                    const count = gameStats.ratingDistribution[rating] || 0
                    const maxCount = Math.max(...Object.values(gameStats.ratingDistribution))
                    const heightPx = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 8 : 0) : 0
                    
                    return (
                      <div key={rating} className="flex flex-col items-center justify-end gap-1" style={{ height: '120px', flex: '1' }}>
                        {count > 0 && (
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{count}</div>
                        )}
                        <div 
                          className="w-full rounded-t"
                          style={{ 
                            height: `${heightPx}px`,
                            backgroundColor: getRatingColor(rating),
                            opacity: count > 0 ? 1 : 0.2,
                            minWidth: '12px',
                            transition: 'height 0.3s ease'
                          }}
                        />
                        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{rating}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                  Rating (0-10)
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 size={48} style={{ color: 'var(--color-accent-500)' }} className="mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Loading Statistics...</h2>
            </div>
          )}
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
