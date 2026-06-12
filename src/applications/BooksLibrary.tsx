import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  CheckCircle2,
  BarChart3,
  Zap
} from 'lucide-react'

interface Book {
  Book: string
  Genre: string
  Rating: number
  Completed: string
  'Quick Review': string
}

interface SortConfig {
  key: keyof Book | null
  direction: 'asc' | 'desc'
}

type CompletionStatus = 'completed' | 'reading' | 'na' | 'not-completed'

const parseCsvLine = (line: string): string[] => {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

const getCompletionStatus = (value: string): CompletionStatus => {
  const completed = value.toLowerCase().trim()

  if (completed === 'yes' || completed === 'y' || completed === 'true' || completed === 'completed' || completed === 'done' || completed === '1') {
    return 'completed'
  }

  if (completed === 'reading') {
    return 'reading'
  }

  if (completed === 'n/a' || completed === 'na') {
    return 'na'
  }

  return 'not-completed'
}

const getCompletionSortValue = (value: string): number => {
  switch (getCompletionStatus(value)) {
    case 'completed':
      return 3
    case 'reading':
      return 2
    case 'na':
      return 1
    default:
      return 0
  }
}

const getCompletionLabel = (value: string): string => {
  switch (getCompletionStatus(value)) {
    case 'completed':
      return 'Yes'
    case 'reading':
      return 'Reading'
    case 'na':
      return 'N/A'
    default:
      return 'No'
  }
}

export const BooksLibrary: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('All')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Book', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [activeTab, setActiveTab] = useState<'books' | 'stats'>('books')
  const [windowWidth, setWindowWidth] = useState(1000)
  const containerRef = useRef<HTMLDivElement>(null)

  const itemsPerPage = 20

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      const contentArea = container.querySelector('.books-content-area')
      if (contentArea) {
        setWindowWidth(contentArea.clientWidth)
      } else {
        setWindowWidth(container.clientWidth - 32)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      updateWidth()
    })

    resizeObserver.observe(container)
    updateWidth()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const showCompleted = windowWidth >= 700
  const showGenre = windowWidth >= 550

  useEffect(() => {
    const abortController = new AbortController()
    let isCancelled = false

    const loadBooks = async () => {
      try {
        const response = await fetch('/data/books.csv', { signal: abortController.signal })
        const csvText = await response.text()

        const lines = csvText.split('\n').filter(line => line.trim())
        if (lines.length === 0) {
          setBooks([])
          return
        }

        const headers = parseCsvLine(lines[0])

        const parsedBooks: Book[] = lines.slice(1).map(line => {
          const values = parseCsvLine(line)
          const book = {} as Record<string, string | number>

          headers.forEach((header, index) => {
            book[header.trim()] = values[index] || ''
          })

          book.Rating = Number.parseInt(String(book.Rating), 10) || 0

          return book as Book
        })

        if (!isCancelled && !abortController.signal.aborted) {
          setBooks(parsedBooks)
        }
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.error('Failed to load books:', error)
        }
      } finally {
        if (!isCancelled && !abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadBooks()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [])

  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(books.map(book => book.Genre).filter(Boolean))]
    return ['All', ...uniqueGenres.sort()]
  }, [books])

  const filteredAndSortedBooks = useMemo(() => {
    const filtered = books.filter(book => {
      const matchesSearch = book.Book.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGenre = selectedGenre === 'All' || book.Genre === selectedGenre
      return matchesSearch && matchesGenre
    })

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]

        if (sortConfig.key === 'Rating') {
          return sortConfig.direction === 'asc'
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number)
        }

        if (sortConfig.key === 'Completed') {
          const aScore = getCompletionSortValue(String(aValue))
          const bScore = getCompletionSortValue(String(bValue))
          return sortConfig.direction === 'asc' ? aScore - bScore : bScore - aScore
        }

        return sortConfig.direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue))
      })
    }

    return filtered
  }, [books, searchTerm, selectedGenre, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedBooks.length / itemsPerPage)
  const paginatedBooks = filteredAndSortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const bookStats = useMemo(() => {
    if (books.length === 0) return null

    const totalBooks = books.length
    const completedBooks = books.filter(book => getCompletionStatus(book.Completed) === 'completed').length

    const ratedBooks = books.filter(book => book.Rating > 0)
    const averageRating = ratedBooks.length > 0
      ? ratedBooks.reduce((sum, book) => sum + book.Rating, 0) / ratedBooks.length
      : 0

    const bestBooks = ratedBooks.filter(book => book.Rating >= 9)
    const worstBooks = ratedBooks.filter(book => book.Rating <= 4)

    const randomBestBook = bestBooks.length > 0
      ? bestBooks[Math.floor(Math.random() * bestBooks.length)]
      : null

    const randomWorstBook = worstBooks.length > 0
      ? worstBooks[Math.floor(Math.random() * worstBooks.length)]
      : null

    const genreStats = books.reduce((acc, book) => {
      const genre = book.Genre || 'Unknown'
      acc[genre] = (acc[genre] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const ratingDistribution = ratedBooks.reduce((acc, book) => {
      const rating = Math.floor(book.Rating)
      acc[rating] = (acc[rating] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      totalBooks,
      completedBooks,
      completionRate: totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0,
      averageRating: Number(averageRating.toFixed(1)),
      ratedBooks: ratedBooks.length,
      randomBestBook,
      randomWorstBook,
      genreStats,
      ratingDistribution
    }
  }, [books])

  const handleSort = (key: keyof Book) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setCurrentPage(1)
  }

  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
  }

  const getRatingColor = (rating: number) => {
    if (rating <= 0) return '#dc2626'
    if (rating >= 10) return '#16a34a'

    if (rating <= 7) {
      const ratio = rating / 7
      const red = Math.round(220 - (220 - 234) * ratio)
      const green = Math.round(38 + (179 - 38) * ratio)
      const blue = Math.round(38 - 38 * ratio)
      return `rgb(${red}, ${green}, ${blue})`
    }

    const ratio = (rating - 7) / 3
    const red = Math.round(234 - 212 * ratio)
    const green = Math.round(179 + 84 * ratio)
    const blue = Math.round(0 + 74 * ratio)
    return `rgb(${red}, ${green}, ${blue})`
  }

  const isCompleted = (value: string) => {
    return getCompletionStatus(value) === 'completed'
  }

  const getCompletionBadgeClasses = (value: string) => {
    switch (getCompletionStatus(value)) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'reading':
        return 'bg-blue-100 text-blue-700'
      case 'na':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--color-accent-500)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading library...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col books-library-container" style={{ backgroundColor: 'var(--window-content-bg)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--window-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: 'var(--color-accent-500)' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Library
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm px-2 py-1 rounded" style={{
                backgroundColor: 'var(--color-accent-100)',
                color: 'var(--color-accent-700)'
              }}>
                {filteredAndSortedBooks.length} books
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'books' ? 'text-white' : 'hover:opacity-80'}`}
            style={{
              backgroundColor: activeTab === 'books' ? 'var(--color-accent-500)' : 'var(--color-accent-100)',
              color: activeTab === 'books' ? 'white' : 'var(--color-accent-700)'
            }}
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              Books
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'stats' ? 'text-white' : 'hover:opacity-80'}`}
            style={{
              backgroundColor: activeTab === 'stats' ? 'var(--color-accent-500)' : 'var(--color-accent-100)',
              color: activeTab === 'stats' ? 'white' : 'var(--color-accent-700)'
            }}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              Stats
            </div>
          </button>
        </div>

        {activeTab === 'books' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search books..."
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
          </div>
        )}
      </div>

      {activeTab === 'books' ? (
        <>
          <div className="flex-1 overflow-auto books-content-area">
            <table className="w-full border-collapse" style={{ minWidth: '500px' }}>
              <thead>
                <tr className="border-b-2" style={{
                  backgroundColor: 'var(--color-primary-100)',
                  borderColor: 'var(--window-border)'
                }}>
                  <th className="text-left p-3 font-medium text-xs" style={{
                    color: 'var(--text-secondary)',
                    minWidth: '220px',
                    width: '50%'
                  }}>
                    <button
                      onClick={() => handleSort('Book')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      style={{ color: 'inherit' }}
                    >
                      Book
                      {sortConfig.key === 'Book' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  {showGenre && (
                    <th className="text-center p-3 font-medium text-xs" style={{
                      color: 'var(--text-secondary)',
                      minWidth: '120px',
                      width: '20%'
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
                    width: '15%'
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
                  {showCompleted && (
                    <th className="text-center p-3 font-medium text-xs" style={{
                      color: 'var(--text-secondary)',
                      minWidth: '80px',
                      width: '15%'
                    }}>
                      <button
                        onClick={() => handleSort('Completed')}
                        className="flex items-center gap-1 hover:text-primary transition-colors mx-auto"
                        style={{ color: 'inherit' }}
                      >
                        Completed
                        {sortConfig.key === 'Completed' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedBooks.map((book, index) => (
                  <tr
                    key={`${book.Book}-${index}`}
                    onClick={() => handleBookClick(book)}
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
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center group-hover:opacity-80 transition-opacity flex-shrink-0"
                          style={{ backgroundColor: 'var(--color-primary-200)' }}
                        >
                          <BookOpen size={14} />
                        </div>
                        <span
                          className="font-medium"
                          style={{
                            color: 'var(--text-primary)',
                            wordBreak: 'break-word',
                            hyphens: 'auto',
                            lineHeight: '1.3'
                          }}
                          title={book.Book}
                        >
                          {book.Book}
                        </span>
                      </div>
                    </td>
                    {showGenre && (
                      <td className="p-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-sm" title={book.Genre}>{book.Genre}</span>
                      </td>
                    )}
                    <td className="p-3 text-center">
                      <div
                        className="px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1"
                        style={{
                          backgroundColor: getRatingColor(book.Rating),
                          color: 'white'
                        }}
                      >
                        <Star size={10} />
                        {book.Rating}/10
                      </div>
                    </td>
                    {showCompleted && (
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${getCompletionBadgeClasses(book.Completed)}`}>
                          {getCompletionLabel(book.Completed)}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--window-border)' }}>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBooks.length)} of {filteredAndSortedBooks.length} books
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
        <div className="flex-1 overflow-auto p-6">
          {bookStats ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={20} style={{ color: 'var(--color-accent-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Total Books</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-accent-600)' }}>{bookStats.totalBooks}</p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={20} style={{ color: 'var(--color-green-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Completion Rate</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-green-600)' }}>
                    {bookStats.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {bookStats.completedBooks} of {bookStats.totalBooks} completed
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={20} style={{ color: 'var(--color-yellow-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Average Rating</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-yellow-600)' }}>
                    {bookStats.averageRating}/10
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {bookStats.ratedBooks} books rated
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={20} style={{ color: 'var(--color-blue-500)' }} />
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Completed</h3>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-blue-600)' }}>{bookStats.completedBooks}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Finished books in the library
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookStats.randomBestBook && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-green-50)', border: '1px solid var(--color-green-200)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} style={{ color: 'var(--color-green-500)' }} />
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Random Great Book</h3>
                    </div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{bookStats.randomBestBook.Book}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Rating: {bookStats.randomBestBook.Rating}/10 • {bookStats.randomBestBook.Genre}
                    </p>
                  </div>
                )}

                {bookStats.randomWorstBook && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-red-50)', border: '1px solid var(--color-red-200)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} style={{ color: 'var(--color-red-500)' }} />
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Random Low Rated Book</h3>
                    </div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{bookStats.randomWorstBook.Book}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Rating: {bookStats.randomWorstBook.Rating}/10 • {bookStats.randomWorstBook.Genre}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Top Genres</h3>
                  <div className="space-y-2">
                    {Object.entries(bookStats.genreStats)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([genre, count]) => (
                        <div key={genre} className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{genre}</span>
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--window-border)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Rating Distribution</h3>
                  <div className="flex items-end justify-center gap-1" style={{ height: '120px' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => {
                      const count = bookStats.ratingDistribution[rating] || 0
                      const values = Object.values(bookStats.ratingDistribution)
                      const maxCount = values.length > 0 ? Math.max(...values) : 0
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
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 size={48} style={{ color: 'var(--color-accent-500)' }} className="mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Loading Statistics...</h2>
            </div>
          )}
        </div>
      )}

      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedBook(null)}>
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-auto"
            style={{ backgroundColor: 'var(--window-bg)', color: 'var(--text-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-4">{selectedBook.Book}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Genre:</span> {selectedBook.Genre}
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Rating:</span>
                  <span
                    className="ml-2 px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1"
                    style={{
                      backgroundColor: getRatingColor(selectedBook.Rating),
                      color: 'white'
                    }}
                  >
                    <Star size={10} />
                    {selectedBook.Rating}/10
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Completed:</span> {
                    getCompletionLabel(selectedBook.Completed)
                  }
                </div>
              </div>
            </div>

            {selectedBook['Quick Review'] && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Review:</h3>
                <p className="text-sm leading-relaxed">{selectedBook['Quick Review']}</p>
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
                  alert(`Opening ${selectedBook.Book}... (Just kidding! 📚)`)
                }}
              >
                <BookOpen size={16} />
                Open Book
              </button>

              <button
                onClick={() => setSelectedBook(null)}
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