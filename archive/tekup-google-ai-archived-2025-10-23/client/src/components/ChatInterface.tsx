import React, { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Sparkles, Mail, Calendar, CheckCircle, Clock, Copy, CheckCheck, RotateCcw, Mic, MicOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatResponse {
  sessionId: string
  response: {
    intent: {
      intent: string
      confidence: number
      rationale: string
    }
    plan: Array<{
      type: string
      provider: string
    }>
    execution: {
      summary: string
      actions: Array<{
        taskId: string
        provider: string
        status: string
        detail: string
      }>
    }
  }
}

const STORAGE_KEY = 'renos-chat-history'

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load chat history from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Fallback to default message
        }
      }
    }
    return [
      {
        role: 'assistant',
        content: 'Hej! Jeg er RenOS AI-assistenten. Hvordan kan jeg hjælpe dig i dag?',
        timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      },
    ]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [isListening, setIsListening] = useState(false)
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'da-DK'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      setSpeechRecognition(recognition)
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput('')
    setLoading(true)
    setStreaming(true)
    setStreamingMessage('')

    // Use environment variable with absolute URL fallback
    const API_BASE = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : 'https://api.renos.dk/api';

    try {
      // Try streaming endpoint first
      const streamResponse = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          channel: 'desktop',
          sessionId: sessionId || undefined,
        }),
      })

      if (streamResponse.ok && streamResponse.body) {
        // Handle streaming response
        const reader = streamResponse.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedMessage = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulatedMessage += parsed.content
                  setStreamingMessage(accumulatedMessage)
                }
                if (parsed.sessionId && parsed.sessionId !== sessionId) {
                  setSessionId(parsed.sessionId)
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Add final message
        const assistantMessage: Message = {
          role: 'assistant',
          content: accumulatedMessage || 'Beklager, jeg kunne ikke generere et svar.',
          timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setStreamingMessage('')
      } else {
        // Fallback to regular endpoint
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userInput,
            channel: 'desktop',
            sessionId: sessionId || undefined,
          }),
        })

        if (!response.ok) {
          throw new Error(`API fejl: ${response.status} ${response.statusText}`)
        }

        const data: ChatResponse = await response.json()

        // Save sessionId for context awareness
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId)
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: formatResponse(data),
          timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ **Fejl:** ${error instanceof Error ? error.message : 'Kunne ikke forbinde til serveren'}\n\nKlik på retry-knappen for at prøve igen.`,
        timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setStreaming(false)
      setStreamingMessage('')
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const retryLastMessage = () => {
    if (messages.length < 2) return

    // Find the last user message
    const lastUserMessageIndex = messages.map((m, i) => ({ m, i }))
      .reverse()
      .find(({ m }) => m.role === 'user')

    if (lastUserMessageIndex) {
      const lastUserMessage = lastUserMessageIndex.m.content
      // Remove messages after the last user message
      setMessages((prev) => prev.slice(0, lastUserMessageIndex.i + 1))
      // Resend the message
      setInput(lastUserMessage)
      setTimeout(() => sendMessage(), 100)
    }
  }

  const formatResponse = (data: ChatResponse): string => {
    const { intent, execution } = data.response
    const confidence = Math.round(intent.confidence * 100)

    // Handle different intent types with smart, user-friendly responses
    const intentType = intent.intent.toLowerCase()

    // Check if this is a "noop" or unknown intent
    const isNoop = execution.actions.some(a => a.provider === 'system' && a.detail.includes('noop'))
    const isUnknown = intentType.includes('unknown') || confidence < 50

    if (isNoop || isUnknown) {
      // For unknown intents, give helpful responses
      return `Hmm, jeg er ikke helt sikker på hvad du ønsker. 🤔

Her er hvad jeg kan hjælpe med:

📧 **Leads** - "Vis seneste leads" eller "Hvordan går det med leads?"
📅 **Booking** - "Find ledig tid i morgen" eller "Book møde"
💰 **Tilbud** - "Lav tilbud" eller "Send tilbud til kunde"
👤 **Kunder** - "Vis kunder" eller "Søg efter kunde"
📊 **Statistik** - "Vis dashboard" eller "Hvordan går det?"

Prøv at omformulere din forespørgsel, så forstår jeg dig bedre! 😊`
    }

    // Intent-specific friendly responses
    let response = ''

    if (intentType.includes('email') || intentType.includes('lead')) {
      response = `📧 **Lead Håndtering**\n\n`
      if (execution.actions.length > 0) {
        const successActions = execution.actions.filter(a => a.status === 'success')
        const queuedActions = execution.actions.filter(a => a.status === 'queued')

        if (successActions.length > 0) {
          response += `Jeg har behandlet ${successActions.length} lead(s):\n\n`
          successActions.forEach(a => response += `✅ ${a.detail}\n`)
        }
        if (queuedActions.length > 0) {
          response += `\n⏳ I kø: ${queuedActions.length} handling(er)\n`
        }
      } else {
        response += `Jeg er klar til at håndtere leads! Send mig en email eller spørg om seneste leads.`
      }
    } else if (intentType.includes('booking') || intentType.includes('calendar')) {
      response = `📅 **Booking & Kalender**\n\n`
      if (execution.actions.length > 0) {
        execution.actions.forEach(action => {
          if (action.status === 'success') {
            response += `✅ ${action.detail}\n`
          } else if (action.status === 'queued') {
            response += `⏳ Tjekker kalenderen...\n`
          }
        })
      } else {
        response += `Jeg kan hjælpe med at:\n• Finde ledige tider\n• Booke møder\n• Se kommende bookinger\n\nHvad vil du gerne?`
      }
    } else if (intentType.includes('quote')) {
      response = `💰 **Tilbud**\n\n`
      response += execution.actions.length > 0
        ? `Arbejder på dit tilbud...\n\n${execution.actions.map(a => `${a.status === 'success' ? '✅' : '⏳'} ${a.detail}`).join('\n')}`
        : `Jeg kan hjælpe med at lave tilbud! Fortæl mig mere om opgaven.`
    } else if (intentType.includes('customer')) {
      response = `👤 **Kunde Information**\n\n`
      response += execution.actions.length > 0
        ? execution.actions.map(a => `${a.status === 'success' ? '✅' : '📋'} ${a.detail}`).join('\n')
        : `Jeg kan søge i kundekartotek. Hvem leder du efter?`
    } else if (intentType.includes('dashboard') || intentType.includes('stats')) {
      response = `📊 **Dashboard & Statistik**\n\n`
      response += `Gå til Dashboard-fanen for at se:\n• Kundestatistik\n• Seneste leads\n• Kommende bookinger\n• Omsætning\n• Cache performance`
    } else {
      // Generic helpful response
      response = `${execution.summary}\n\n`
      if (execution.actions.length > 0) {
        response += execution.actions.map(a => {
          const emoji = a.status === 'success' ? '✅' : a.status === 'queued' ? '⏳' : '📋'
          return `${emoji} ${a.detail}`
        }).join('\n')
      }
    }

    return response.trim()
  }

  const clearHistory = () => {
    const confirmClear = window.confirm('Vil du rydde chat historikken?')
    if (confirmClear) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: 'Chat historik ryddet. Hvordan kan jeg hjælpe dig?',
        timestamp: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages([welcomeMessage])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const toggleVoiceInput = () => {
    if (!speechRecognition) {
      alert('Stemmegenkendelse er ikke understøttet i denne browser')
      return
    }

    if (isListening) {
      speechRecognition.stop()
    } else {
      speechRecognition.start()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="glass-card flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-glass pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-light border border-primary/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-color" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">RenOS AI Assistant</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Altid klar til at hjælpe</p>
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={clearHistory}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-glass-hover rounded-lg transition-all flex items-center gap-2"
                title="Ryd chat historik"
              >
                <Clock className="w-4 h-4" />
                Ryd historik
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-4 sm:p-6 overflow-hidden">
          {/* Messages */}
          <div ref={messagesContainerRef} data-testid="messages-container" className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div
                    className={`rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] ${message.role === 'user'
                      ? 'bg-primary/90 text-white shadow-lg shadow-primary/20'
                      : 'glass-card border border-glass'
                      }`}
                  >
                    <div className={`prose prose-sm max-w-none ${message.role === 'user'
                      ? 'prose-invert'
                      : 'prose-slate prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground'
                      }`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <p className={`text-xs flex items-center gap-1.5 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                        <Clock className="w-3 h-3" />
                        {message.timestamp}
                      </p>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(message.content, index)}
                            className="p-1.5 hover:bg-glass-hover rounded-lg transition-all text-muted-foreground hover:text-foreground"
                            title="Kopier besked"
                          >
                            {copiedIndex === index ? (
                              <CheckCheck className="w-4 h-4 text-success-color" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {message.content.includes('❌') && (
                            <button
                              onClick={retryLastMessage}
                              className="p-1.5 hover:bg-glass-hover rounded-lg transition-all text-muted-foreground hover:text-foreground"
                              title="Prøv igen"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-2">
                  {streaming && streamingMessage ? (
                    <div className="glass-card border border-glass rounded-2xl p-5" data-testid="streaming-indicator">
                      <div className="prose prose-sm max-w-none prose-slate prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingMessage}
                        </ReactMarkdown>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          Skriver...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card border border-glass rounded-2xl p-5 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary-color animate-pulse" />
                      <span className="text-base text-foreground animate-pulse">RenOS tænker</span>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-primary-color rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary-color rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary-color rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && !loading && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setInput('Vis seneste leads')}
                className="px-4 py-2 text-sm bg-primary-light text-primary-color rounded-xl border border-primary/30 hover:scale-105 hover:border-primary/50 transition-all flex items-center gap-2 font-medium"
              >
                <Mail className="w-4 h-4" />
                Se seneste leads
              </button>
              <button
                onClick={() => setInput('Find ledig tid i morgen')}
                className="px-4 py-2 text-sm bg-success-light text-success-color rounded-xl border border-success/30 hover:scale-105 hover:border-success/50 transition-all flex items-center gap-2 font-medium"
              >
                <Calendar className="w-4 h-4" />
                Find ledig tid
              </button>
              <button
                onClick={() => setInput('Vis statistik')}
                className="px-4 py-2 text-sm bg-warning-light text-warning-color rounded-xl border border-warning/30 hover:scale-105 hover:border-warning/50 transition-all flex items-center gap-2 font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Vis statistik
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv din besked..."
              className="flex-1 px-6 py-4 glass bg-glass border border-glass rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all text-base"
              disabled={loading}
              data-testid="chat-input"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoiceInput}
                disabled={loading}
                className={`p-3 rounded-xl transition-all duration-200 ${isListening
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'glass-card border border-glass hover:bg-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop optagelse' : 'Start stemmeoptagelse'}
                data-testid="voice-button"
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 animate-pulse" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl bg-primary-color text-white hover:bg-primary-color/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                data-testid="send-button"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {messages.length > 1 && (
              <button
                onClick={clearHistory}
                className="px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-glass-hover rounded-2xl transition-all"
                title="Ryd chat historik"
              >
                <Clock className="w-5 h-5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
