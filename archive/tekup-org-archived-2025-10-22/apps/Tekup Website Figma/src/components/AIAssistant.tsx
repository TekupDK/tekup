'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Brain, 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Zap,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  PieChart,
  Activity,
  Clock
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  suggestions?: string[];
  data?: any;
}

interface AIInsight {
  id: string;
  type: 'lead_opportunity' | 'performance_alert' | 'trend_analysis' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const mockInsights: AIInsight[] = [
  {
    id: '1',
    type: 'lead_opportunity',
    title: 'Hot Lead Opportunity',
    description: 'TechCorp A/S har vist høj engagement med dine emails og besøgt pricing siden 3 gange. Anbefaler personlig outreach inden for 24 timer.',
    confidence: 92,
    impact: 'high',
    actionable: true,
    action: {
      label: 'Send personlig email',
      onClick: () => toast.success('Åbner email template...')
    }
  },
  {
    id: '2',
    type: 'performance_alert',
    title: 'Konverteringsrate fald',
    description: 'Din konverteringsrate er faldet 15% denne uge. Primær årsag: færre opfølgningskald.',
    confidence: 87,
    impact: 'medium',
    actionable: true,
    action: {
      label: 'Se opfølgnings strategi',
      onClick: () => toast.info('Åbner strategi guide...')
    }
  },
  {
    id: '3',
    type: 'trend_analysis',
    title: 'Sæsonmønster opdaget',
    description: 'Historisk data viser 40% stigning i leads i Q4. Forbereder optimeret kampagne strategi.',
    confidence: 94,
    impact: 'high',
    actionable: false
  },
  {
    id: '4',
    type: 'recommendation',
    title: 'Email timing optimering',
    description: 'Dine emails får 23% højere åbningsrate når sendt tirsdag kl. 14:00-16:00.',
    confidence: 78,
    impact: 'medium',
    actionable: true,
    action: {
      label: 'Planlæg emails',
      onClick: () => toast.success('Åbner email scheduler...')
    }
  }
];

interface AIAssistantProps {
  compact?: boolean;
}

export function AIAssistant({ compact = false }: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hej! Jeg er Jarvis, din AI assistent. Jeg kan hjælpe dig med at optimere dine leads, analysere performance og automatisere opgaver. Hvad kan jeg hjælpe med i dag?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      suggestions: [
        'Vis mig dagens leads',
        'Analyser konverteringsrate',
        'Planlæg opfølgning',
        'Optimér email kampagne'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI performance metrics
  const [aiMetrics] = useState({
    tasksAutomated: 247,
    timeSaved: 8.5, // hours
    accuracy: 94.3,
    activeAutomations: 12
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response with shorter timeout to prevent timeout errors
    try {
      setTimeout(() => {
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: generateAIResponse(content),
          timestamp: new Date(),
          suggestions: generateSuggestions(content)
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 800 + Math.random() * 500); // Reduced from 1500ms + 1000ms random
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast.error('Der opstod en fejl ved sending af besked');
    }
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('lead') || lowerInput.includes('kunde')) {
      return 'Jeg kan se du har 5 varme leads der kræver opmærksomhed. TechCorp A/S har højest score (92/100) og Danske Bank har booket demo i morgen. Skal jeg prioritere opfølgning på TechCorp?';
    } else if (lowerInput.includes('konvertering') || lowerInput.includes('conversion')) {
      return 'Din konverteringsrate er 68.2% denne måned - det er 12% over branchemiddel! Top konverterende kanaler: LinkedIn (78%), Email (65%), Direct (71%). Vil du se detaljeret analyse?';
    } else if (lowerInput.includes('email') || lowerInput.includes('kampagne')) {
      return 'Baseret på dine data, anbefaler jeg at sende emails tirsdag-torsdag kl. 14-16. Personaliserede emner får 34% højere åbningsrate. Skal jeg oprette en optimeret kampagne?';
    } else if (lowerInput.includes('rapport') || lowerInput.includes('analyse')) {
      return 'Jeg har genereret en omfattende rapport der viser 23% stigning i lead kvalitet og 15% reduktion i sales cycle. Performance er stærkest i Tech og Healthcare sektorerne. Vil du se fuld rapport?';
    } else if (lowerInput.includes('automatiser') || lowerInput.includes('automation')) {
      return 'Jeg kan automatisere lead scoring, email sequences, meeting booking og opfølgning. Dette sparer typisk 6-8 timer ugentligt. Hvilken proces vil du starte med?';
    }
    
    return 'Tak for dit spørgsmål! Jeg analyserer dine data og kommer med personaliserede anbefalinger. Baseret på din nuværende performance, foreslår jeg at fokusere på lead nurturing og email optimering. Hvad interesserer dig mest?';
  };

  const generateSuggestions = (input: string): string[] => {
    const baseSuggestions = [
      'Se detaljeret analyse',
      'Opret automatisering',
      'Planlæg opfølgning',
      'Eksporter rapport'
    ];

    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('lead')) {
      return ['Prioriter hot leads', 'Se lead scoring', 'Planlæg outreach', 'Analyser sources'];
    } else if (lowerInput.includes('email')) {
      return ['Optimér send tid', 'Test A/B emner', 'Se open rates', 'Personalisér content'];
    }
    
    return baseSuggestions;
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast.info('🎤 Lytter...');
      // Simulate voice recognition with shorter timeout
      setTimeout(() => {
        setIsListening(false);
        setInputValue('Vis mig dagens performance');
        toast.success('Stemme input modtaget!');
      }, 2000); // Reduced from 3000ms to 2000ms
    }
  };

  const insightIcons = {
    lead_opportunity: Target,
    performance_alert: AlertTriangle,
    trend_analysis: TrendingUp,
    recommendation: Lightbulb
  };

  const insightColors = {
    lead_opportunity: 'emerald',
    performance_alert: 'orange',
    trend_analysis: 'blue',
    recommendation: 'purple'
  };

  const impactColors = {
    low: 'gray',
    medium: 'yellow',
    high: 'red'
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl hover:shadow-2xl transition-all"
        >
          <Brain className="w-6 h-6 text-white" />
          <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 bg-cyan-400 border-0 rounded-full animate-pulse" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${compact ? 'fixed bottom-4 right-4 z-50' : 'w-full'}`}
    >
      <Card className={`bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl ${
        compact ? 'w-96 max-h-[600px]' : 'h-full'
      }`}>
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center">
                  Jarvis AI
                  <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-1 animate-pulse" />
                    Online
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400">AI Performance Assistent</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {compact && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-white"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* AI Metrics */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Opgaver automatiseret</span>
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-lg font-bold text-white">{aiMetrics.tasksAutomated}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Timer sparet</span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-lg font-bold text-white">{aiMetrics.timeSaved}t</p>
              </div>
            </motion.div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-4">
            {/* AI Insights */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <h4 className="font-medium text-white">AI Insights</h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {insights.map((insight) => {
                  const Icon = insightIcons[insight.type];
                  const color = insightColors[insight.type];
                  const impactColor = impactColors[insight.impact];

                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer transition-all hover:bg-white/10 ${
                        activeInsight === insight.id ? 'ring-2 ring-cyan-400/50' : ''
                      }`}
                      onClick={() => setActiveInsight(activeInsight === insight.id ? null : insight.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 text-${color}-400`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-white text-sm">{insight.title}</h5>
                            <div className="flex items-center space-x-2">
                              <Badge className={`px-1.5 py-0.5 text-xs bg-${impactColor}-500/20 text-${impactColor}-400 border border-${impactColor}-400/30`}>
                                {insight.impact}
                              </Badge>
                              <span className="text-xs text-gray-400">{insight.confidence}%</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">{insight.description}</p>
                          
                          {activeInsight === insight.id && insight.action && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2"
                            >
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  insight.action?.onClick();
                                }}
                                className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-500/30"
                              >
                                {insight.action.label}
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-white/20" />

            {/* Chat Interface */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h4 className="font-medium text-white">Chat med Jarvis</h4>
              </div>

              {/* Messages */}
              <ScrollArea className="h-64 mb-3">
                <div className="space-y-3 pr-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ml-auto'
                            : 'bg-white/10 text-gray-100'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-1">
                          {message.timestamp.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {/* AI Suggestions */}
                        {message.type === 'ai' && message.suggestions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      {message.type === 'ai' && (
                        <Avatar className="w-6 h-6 order-1 mr-2 mt-1">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                            J
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <Avatar className="w-6 h-6 mr-2 mt-1">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                          J
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white/10 text-gray-100 p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                    placeholder="Spørg Jarvis om noget..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 backdrop-blur-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoice}
                  className={`border-white/20 transition-colors ${
                    isListening 
                      ? 'bg-red-500/20 text-red-400 border-red-400/30' 
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}