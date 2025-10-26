import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Command, ArrowRight, Zap, Settings, Users, BarChart3, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  title: string
  description: string
  category: 'AI Service' | 'Page' | 'Command' | 'Feature'
  icon: React.ReactNode
  path: string
  keywords: string[]
}

// Mock search results
const searchResults: SearchResult[] = [
  {
    id: 'proposal-engine',
    title: 'AI Proposal Engine',
    description: 'Generer AI-drevne forslag fra sales calls',
    category: 'AI Service',
    icon: <Zap className="w-4 h-4" />,
    path: '/proposal-engine',
    keywords: ['proposal', 'forslag', 'ai', 'sales', 'generate']
  },
  {
    id: 'content-generator',
    title: 'Content Generator',
    description: 'Skab indhold til blog, sociale medier og marketing',
    category: 'AI Service',
    icon: <BarChart3 className="w-4 h-4" />,
    path: '/content-generator',
    keywords: ['content', 'indhold', 'blog', 'social', 'marketing']
  },
  {
    id: 'customer-support',
    title: 'Customer Support',
    description: 'AI-drevet kundesupport og chatbot',
    category: 'AI Service',
    icon: <Users className="w-4 h-4" />,
    path: '/customer-support',
    keywords: ['support', 'chatbot', 'customer', 'kunde', 'chat']
  },
  {
    id: 'settings',
    title: 'Indstillinger',
    description: 'Konfigurer platform og AI services',
    category: 'Page',
    icon: <Settings className="w-4 h-4" />,
    path: '/settings',
    keywords: ['settings', 'indstillinger', 'config', 'konfiguration']
  }
]

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults(searchResults.slice(0, 6)) // Show recent/popular items
    } else {
      const filtered = searchResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      )
      setResults(filtered)
    }
    setSelectedIndex(0)
  }, [query])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  const handleSelect = (result: SearchResult) => {
    navigate(result.path)
    onClose()
    setQuery('')
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AI Service': return 'text-primary-400 bg-primary-500/20'
      case 'Page': return 'text-accent-400 bg-accent-500/20'
      case 'Command': return 'text-success-400 bg-success-500/20'
      case 'Feature': return 'text-warning-400 bg-warning-500/20'
      default: return 'text-slate-400 bg-slate-500/20'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl glass-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-4 p-6 border-b border-white/10">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Søg AI services, sider, kommandoer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-lg"
                autoFocus
              />
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full text-left px-6 py-3 flex items-center gap-4 transition-colors ${
                        index === selectedIndex 
                          ? 'bg-white/10 text-white' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${getCategoryColor(result.category)}`}>
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-slate-400 truncate">{result.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(result.category)}`}>
                          {result.category}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="py-12 text-center">
                  <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Ingen resultater</h3>
                  <p className="text-slate-400">
                    Ingen matches for "{query}". Prøv et andet søgeord.
                  </p>
                </div>
              ) : (
                <div className="py-6">
                  <div className="px-6 pb-3">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                      Populære AI Services
                    </h3>
                  </div>
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full text-left px-6 py-3 flex items-center gap-4 transition-colors ${
                        index === selectedIndex 
                          ? 'bg-white/10 text-white' 
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${getCategoryColor(result.category)}`}>
                        {result.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-slate-400">{result.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-slate-800/50">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Command className="w-3 h-3" />
                    <span>⌘K for at åbne</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>↑↓ for navigation</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>↵ for at vælge</span>
                  </div>
                </div>
                <div>
                  <span>ESC for at lukke</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Global keyboard shortcut
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpen])
}

