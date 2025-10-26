import { useState, useEffect, useRef } from 'react'
import { Search, X, Users, Target, Calendar, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'

interface SearchResult {
  id: string
  type: 'customer' | 'lead' | 'booking' | 'quote'
  title: string
  subtitle?: string
  icon: JSX.Element
  onClick: () => void
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: string) => void
}

const iconMap = {
  customer: <Users className="w-4 h-4" />,
  lead: <Target className="w-4 h-4" />,
  booking: <Calendar className="w-4 h-4" />,
  quote: <FileText className="w-4 h-4" />
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (debouncedQuery.length > 0) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    
    // Simulate API search
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'customer' as const,
          title: 'John Doe',
          subtitle: 'john@example.com',
          icon: iconMap.customer,
          onClick: () => {
            onNavigate('customers')
            onClose()
          }
        },
        {
          id: '2',
          type: 'lead' as const,
          title: 'Ny lead fra website',
          subtitle: 'I går kl. 14:32',
          icon: iconMap.lead,
          onClick: () => {
            onNavigate('leads')
            onClose()
          }
        },
        {
          id: '3',
          type: 'booking' as const,
          title: 'Booking i morgen',
          subtitle: '10:00 - 12:00',
          icon: iconMap.booking,
          onClick: () => {
            onNavigate('bookings')
            onClose()
          }
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      setResults(mockResults)
      setLoading(false)
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      results[selectedIndex].onClick()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative glass rounded-2xl w-full max-w-2xl mt-[10vh] shadow-2xl border border-glass/30 animate-fade-in-up">
          {/* Search Input */}
          <div className="flex items-center border-b border-glass/30 p-4 bg-gradient-to-r from-glass/50 to-glass/30 rounded-t-2xl">
            <div className="relative mr-3">
              <Search className="w-5 h-5 text-primary" />
              {!query && (
                <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1 animate-pulse" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Søg efter kunder, leads, bookinger..."
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-base font-medium"
            />
            {loading && (
              <Loader2 className="w-5 h-5 text-primary animate-spin mr-3" />
            )}
            <button
              onClick={onClose}
              className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-glass/50 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={result.onClick}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-glass/50 transition-all duration-200 hover:scale-[1.01] group ${
                    index === selectedIndex ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-l-2 border-primary' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`p-2 rounded-lg bg-glass/50 border border-glass/30 group-hover:shadow-md transition-all duration-200 ${
                    index === selectedIndex ? 'bg-primary/20 border-primary/30' : ''
                  }`}>
                    {result.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {query && !loading && results.length === 0 && (
            <div className="p-12 text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass/50 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                Ingen resultater fundet for "{query}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Prøv at søge med andre ord eller tjek stavningen
              </p>
            </div>
          )}

          {/* Quick Actions */}
          {!query && (
            <div className="p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3 px-2">
                <Sparkles className="w-3 h-3 text-accent" />
                <p className="text-xs text-muted-foreground font-medium">HURTIGE HANDLINGER</p>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onNavigate('leads')
                    onClose()
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-glass/50 transition-all duration-200 text-left group hover:scale-[1.01]"
                >
                  <div className="p-1.5 rounded-md bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground font-medium">Se alle leads</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 ml-auto" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('bookings')
                    onClose()
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-glass/50 transition-all duration-200 text-left group hover:scale-[1.01]"
                >
                  <div className="p-1.5 rounded-md bg-success-color/20 group-hover:bg-success-color/30 transition-colors">
                    <Calendar className="w-4 h-4 text-success-color" />
                  </div>
                  <span className="text-sm text-foreground font-medium">Dagens bookinger</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-success-color group-hover:translate-x-1 transition-all duration-200 ml-auto" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('customers')
                    onClose()
                  }}
                  className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-glass/50 transition-all duration-200 text-left group hover:scale-[1.01]"
                >
                  <div className="p-1.5 rounded-md bg-warning-color/20 group-hover:bg-warning-color/30 transition-colors">
                    <Users className="w-4 h-4 text-warning-color" />
                  </div>
                  <span className="text-sm text-foreground font-medium">Kunde oversigt</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-warning-color group-hover:translate-x-1 transition-all duration-200 ml-auto" />
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-glass/30 p-3 flex items-center justify-between text-xs text-muted-foreground bg-glass/20 rounded-b-2xl">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-glass/50 rounded border border-glass/30 text-foreground font-medium shadow-sm">↑↓</kbd>
                Naviger
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-glass/50 rounded border border-glass/30 text-foreground font-medium shadow-sm">Enter</kbd>
                Vælg
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-glass/50 rounded border border-glass/30 text-foreground font-medium shadow-sm">Esc</kbd>
                Luk
              </span>
            </div>
            <span className="hidden sm:block">
              Tryk <kbd className="px-1.5 py-0.5 bg-glass/50 rounded border border-glass/30 text-foreground font-medium shadow-sm">Ctrl+K</kbd> når som helst
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}