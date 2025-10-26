'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MoreHorizontal,
  X,
  Minimize2,
  Maximize2,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Shield,
  Zap,
  Star,
  FileText,
  Image as ImageIcon,
  Download,
  ThumbsUp,
  ThumbsDown,
  Headphones
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    id: string;
    name: string;
    type: 'image' | 'document' | 'link';
    url: string;
    size?: number;
  }>;
  agent?: {
    name: string;
    avatar?: string;
    role: string;
  };
}

interface SupportAgent {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  rating: number;
  responseTime: string;
  specialties: string[];
}

const mockAgents: SupportAgent[] = [
  {
    id: '1',
    name: 'Sarah Jensen',
    role: 'Senior Support Specialist',
    status: 'online',
    rating: 4.9,
    responseTime: '< 2 min',
    specialties: ['CRM', 'Integrations', 'Automation']
  },
  {
    id: '2',
    name: 'Michael Larsen',
    role: 'Technical Expert',
    status: 'online',
    rating: 4.8,
    responseTime: '< 3 min',
    specialties: ['API', 'Analytics', 'Troubleshooting']
  },
  {
    id: '3',
    name: 'Emma Nielsen',
    role: 'AI Specialist',
    status: 'busy',
    rating: 5.0,
    responseTime: '< 5 min',
    specialties: ['Jarvis AI', 'Machine Learning', 'Optimization']
  }
];

const mockInitialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'system',
    content: 'Du er nu forbundet med vores support team. En agent vil være med dig inden for 1-2 minutter.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2',
    type: 'agent',
    content: 'Hej! Jeg er Sarah fra Tekup support. Jeg kan se du har brug for hjælp - hvad kan jeg hjælpe dig med i dag?',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    status: 'read',
    agent: {
      name: 'Sarah Jensen',
      role: 'Senior Support Specialist'
    }
  }
];

interface LiveChatSupportProps {
  isOpen?: boolean;
  onClose?: () => void;
  userId?: string;
  initialQuery?: string;
}

export function LiveChatSupport({ 
  isOpen = false, 
  onClose, 
  userId = 'demo-user',
  initialQuery 
}: LiveChatSupportProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(mockInitialMessages);
  const [inputValue, setInputValue] = useState(initialQuery || '');
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<SupportAgent>(mockAgents[0]);
  const [chatStatus, setChatStatus] = useState<'connecting' | 'connected' | 'ended'>('connected');
  const [satisfaction, setSatisfaction] = useState<'satisfied' | 'unsatisfied' | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-send initial query if provided
  useEffect(() => {
    if (initialQuery && isOpen) {
      setTimeout(() => {
        sendMessage(initialQuery);
      }, 1000);
    }
  }, [initialQuery, isOpen]);

  // Simulate agent responses
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].type === 'user') {
      setIsTyping(true);
      
      const timeout = setTimeout(() => {
        const responses = [
          'Tak for dit spørgsmål! Lad mig hjælpe dig med det.',
          'Jeg forstår problemet. Har du prøvet at tjekke dine indstillinger?',
          'Det lyder som noget jeg kan hjælpe med. Kan du fortælle mig mere om dit setup?',
          'Perfekt! Jeg kan guide dig gennem processen step-by-step.',
          'Det er et godt spørgsmål. Lad mig finde den bedste løsning for dig.'
        ];

        const agentResponse: ChatMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date(),
          status: 'delivered',
          agent: currentAgent
        };

        setMessages(prev => [...prev, agentResponse]);
        setIsTyping(false);
        
        if (isMinimized) {
          setUnreadCount(prev => prev + 1);
        }
      }, 2000 + Math.random() * 2000);

      return () => clearTimeout(timeout);
    }
  }, [messages, currentAgent, isMinimized]);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Uploaded file: ${file.name}`,
      timestamp: new Date(),
      status: 'sent',
      attachments: [{
        id: Date.now().toString(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        url: URL.createObjectURL(file),
        size: file.size
      }]
    };

    setMessages(prev => [...prev, fileMessage]);
    toast.success('Fil uploaded!');
  };

  const endChat = () => {
    setChatStatus('ended');
    const endMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Chat session afsluttet. Tak for at bruge Tekup support!',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, endMessage]);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('da-DK', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: SupportAgent['status']) => {
    switch (status) {
      case 'online': return 'bg-emerald-400';
      case 'busy': return 'bg-yellow-400';
      case 'away': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  };

  const getMessageStatus = (status?: ChatMessage['status']) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent': return <CheckCircle2 className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCircle2 className="w-3 h-3 text-blue-400" />;
      case 'read': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <Button
          onClick={() => {
            setIsMinimized(false);
            setUnreadCount(0);
          }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl hover:shadow-2xl transition-all"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center bg-red-500 border-0 rounded-full">
              {unreadCount}
            </Badge>
          )}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-0 animate-ping" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="relative w-96 max-w-[calc(100vw-2rem)] max-h-[600px]"
    >
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl">
        {/* Header */}
        <CardHeader className="pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentAgent.avatar} alt={currentAgent.name} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                    {currentAgent.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(currentAgent.status)} rounded-full border-2 border-white dark:border-gray-800`} />
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{currentAgent.name}</h3>
                  <Badge className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-400/30 text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    {currentAgent.rating}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{currentAgent.role}</span>
                  <span>•</span>
                  <span>Svarer typisk {currentAgent.responseTime}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <Video className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMinimized(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Live chat aktiv</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Sikker forbindelse
            </Badge>
          </div>
        </CardHeader>

        {/* Messages */}
        <ScrollArea className="h-80 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'system' ? (
                  <div className="text-center w-full">
                    <div className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                      <AlertCircle className="w-3 h-3 mr-2" />
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                ) : (
                  <div className={`max-w-[75%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.type === 'agent' && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                            {message.agent?.name.split(' ').map(n => n[0]).join('') || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.agent?.name || 'Support Agent'}
                        </span>
                      </div>
                    )}
                    
                    <div className={`p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white ml-auto'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {message.attachments && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-white/20 rounded-lg">
                              {attachment.type === 'image' ? (
                                <ImageIcon className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                              <span className="text-xs flex-1">{attachment.name}</span>
                              <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-400 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{formatTimestamp(message.timestamp)}</span>
                      {message.type === 'user' && getMessageStatus(message.status)}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                      {currentAgent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10">
          {chatStatus === 'ended' ? (
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Hvordan var din support oplevelse?
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  variant={satisfaction === 'satisfied' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSatisfaction('satisfied')}
                  className="flex items-center space-x-1"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>God</span>
                </Button>
                <Button
                  variant={satisfaction === 'unsatisfied' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSatisfaction('unsatisfied')}
                  className="flex items-center space-x-1"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Dårlig</span>
                </Button>
              </div>
              {satisfaction && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Tak for din feedback!
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Skriv din besked her..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                  <button onClick={() => setInputValue('Jeg har brug for hjælp til at sætte CRM op')}>
                    CRM Setup
                  </button>
                  <button onClick={() => setInputValue('Hvordan fungerer Jarvis AI?')}>
                    AI Hjælp
                  </button>
                  <button onClick={() => setInputValue('Jeg vil gerne booke en demo')}>
                    Book Demo
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={endChat}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Afslut chat
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}