import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Paperclip, 
  Mic, 
  MicOff,
  Settings,
  Download,
  Search,
  Plug
} from 'lucide-react';
import PluginManager from './PluginManager';
import { langChainService } from '../services/LangChainService';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'success' | 'error';
  toolUsed?: string;
  data?: any;
  reactions?: Reaction[];
  attachments?: Attachment[];
}

interface SkeletonMessage {
  id: string;
  type: 'skeleton';
  isAssistant: boolean;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface MCPTool {
  name: string;
  description: string;
  endpoint: string;
  icon: string;
  status: 'available' | 'error' | 'loading';
  lastUsed?: Date;
  successRate: number;
}

const MCP_TOOLS: MCPTool[] = [
  {
    name: 'validate_booking_date',
    description: 'Valider booking dato og ugedag',
    endpoint: '/api/v1/tools/validate_booking_date',
    icon: '📅',
    status: 'available',
    successRate: 95
  },
  {
    name: 'check_booking_conflicts',
    description: 'Tjek for dobbeltbookinger',
    endpoint: '/api/v1/tools/check_booking_conflicts',
    icon: '⚠️',
    status: 'available',
    successRate: 90
  },
  {
    name: 'auto_create_invoice',
    description: 'Opret faktura automatisk',
    endpoint: '/api/v1/tools/auto_create_invoice',
    icon: '🧾',
    status: 'available',
    successRate: 85
  },
  {
    name: 'track_overtime_risk',
    description: 'Overvåg overtid risiko',
    endpoint: '/api/v1/tools/track_overtime_risk',
    icon: '⏰',
    status: 'available',
    successRate: 88
  },
  {
    name: 'get_customer_memory',
    description: 'Hent kunde intelligence',
    endpoint: '/api/v1/tools/get_customer_memory',
    icon: '👤',
    status: 'available',
    successRate: 92
  }
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<(Message | SkeletonMessage)[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  // const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MCP_API_URL = 'http://localhost:3001';

  useEffect(() => {
    checkConnection();
    addWelcomeMessage();
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkConnection = async () => {
    try {
      const response = await fetch(`${MCP_API_URL}/health`);
      const data = await response.json();
      setIsConnected(data.status === 'ok');
      
      // Load available tools
      if (data.status === 'ok') {
        const toolsResponse = await fetch(`${MCP_API_URL}/tools`);
        const toolsData = await toolsResponse.json();
        setAvailableTools(toolsData.tools || []);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: `# 🤖 Velkommen til RenOS Calendar MCP!

Jeg er din intelligente kalender assistant og kan hjælpe dig med:

## 📅 **Dato Validering**
"Valider 2025-10-21 som tirsdag"

## ⚠️ **Konflikt Check**
"Tjek konflikt 09:00-12:00"

## 🧾 **Faktura Oprettelse**
"Opret faktura for booking"

## ⏰ **Overtid Tracking**
"Tjek overtid risiko"

## 👤 **Kunde Memory**
"Hent kunde data"

**Prøv at skrive en besked eller klik på et værktøj nedenfor!**`,
      timestamp: new Date(),
      reactions: [
        { emoji: '👋', count: 1, users: ['system'] }
      ]
    };
    setMessages([welcomeMessage]);
  };

  const loadChatHistory = () => {
    const saved = localStorage.getItem('renos-chat-history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setMessages(history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  };

  const saveChatHistory = (newMessages: Message[]) => {
    localStorage.setItem('renos-chat-history', JSON.stringify(newMessages));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const parseUserInput = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('valider') || lowerInput.includes('tjek dato')) {
      return { tool: 'validate_booking_date', data: extractDateData(input) };
    }
    
    if (lowerInput.includes('konflikt') || lowerInput.includes('dobbeltbooking')) {
      return { tool: 'check_booking_conflicts', data: extractTimeData(input) };
    }
    
    if (lowerInput.includes('faktura') || lowerInput.includes('invoice')) {
      return { tool: 'auto_create_invoice', data: { bookingId: `booking-${Date.now()}` } };
    }
    
    if (lowerInput.includes('overtid') || lowerInput.includes('overtime')) {
      return { tool: 'track_overtime_risk', data: { 
        bookingId: `booking-${Date.now()}`,
        currentDuration: 540,
        estimatedDuration: 480
      }};
    }
    
    if (lowerInput.includes('kunde') || lowerInput.includes('customer')) {
      return { tool: 'get_customer_memory', data: { customerId: 'jes-vestergaard' } };
    }
    
    return null;
  };

  const extractDateData = (input: string) => {
    const dateMatch = input.match(/(\d{4}-\d{2}-\d{2})/);
    const dayMatch = input.match(/(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)/i);
    
    return {
      date: dateMatch ? dateMatch[1] : '2025-10-21',
      expectedDayName: dayMatch ? dayMatch[1] : 'tirsdag',
      customerId: 'chatbot-user'
    };
  };

  const extractTimeData = (input: string) => {
    const timeMatch = input.match(/(\d{2}:\d{2})/g);
    const startTime = timeMatch && timeMatch[0] ? `2025-10-21T${timeMatch[0]}:00+02:00` : '2025-10-21T09:00:00+02:00';
    const endTime = timeMatch && timeMatch[1] ? `2025-10-21T${timeMatch[1]}:00+02:00` : '2025-10-21T12:00:00+02:00';
    
    return { startTime, endTime };
  };

  const callMCPTool = async (tool: string, data: any) => {
    try {
      const response = await fetch(`${MCP_API_URL}/api/v1/tools/${tool}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'renos-calendar-mcp-key-2025' // Default API key for testing
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`MCP tool error: ${error}`);
    }
  };

  const formatToolResponse = (tool: string, result: any) => {
    if (!result.success) {
      return `❌ **${tool} fejlede**\n\nFejl: ${result.error?.message || 'Ukendt fejl'}`;
    }

    const data = result.data;
    
    switch (tool) {
      case 'validate_booking_date':
        return data.valid 
          ? `✅ **Dato validering OK!**\n\n📅 Dato: ${data.date || 'N/A'}\n📆 Ugedag: ${data.expectedDayName || 'N/A'}\n🎯 Confidence: ${data.confidence}%\n\n**Booking ser god ud!**`
          : `❌ **Dato validering fejlede!**\n\n📅 Dato: ${data.date || 'N/A'}\n📆 Forventet: ${data.expectedDayName || 'N/A'}\n🎯 Confidence: ${data.confidence}%\n\n**Manuel gennemgang påkrævet!**`;
      
      case 'check_booking_conflicts':
        return data.valid
          ? `✅ **Ingen konflikter fundet!**\n\n⏰ Tid: ${data.startTime?.split('T')[1]?.split('+')[0] || 'N/A'} - ${data.endTime?.split('T')[1]?.split('+')[0] || 'N/A'}\n🎯 Confidence: ${data.confidence}%\n\n**Tidsrum er ledigt!**`
          : `⚠️ **Potentielle konflikter!**\n\n⏰ Tid: ${data.startTime?.split('T')[1]?.split('+')[0] || 'N/A'} - ${data.endTime?.split('T')[1]?.split('+')[0] || 'N/A'}\n🎯 Confidence: ${data.confidence}%\n\n**Tjek manuelt for dobbeltbooking!**`;
      
      case 'auto_create_invoice':
        return `✅ **Faktura oprettet!**\n\n🧾 Booking ID: ${data.bookingId || 'N/A'}\n📊 Status: ${data.status || 'pending'}\n\n**Faktura er klar til afsendelse!**`;
      
      case 'track_overtime_risk':
        return `⚠️ **Overtid risiko detekteret!**\n\n⏰ Nuværende: ${Math.floor((data.currentDuration || 540) / 60)} timer\n📊 Estimaret: ${Math.floor((data.estimatedDuration || 480) / 60)} timer\n🚨 Overtid: ${Math.floor(((data.currentDuration || 540) - (data.estimatedDuration || 480)) / 60)} time\n\n**Kritisk alert sendt!**`;
      
      case 'get_customer_memory':
        return `📊 **Kunde Intelligence**\n\n👤 Kunde: ${data.customerId || 'N/A'}\n📈 Mønstre: Kun mandage kl. 08:30\n😊 Satisfaction: 95%\n\n**AI-powered kunde data!**`;
      
      default:
        return `✅ **${tool} udført**\n\nResultat: ${JSON.stringify(data, null, 2)}`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sending'
    };

    const userInput = input;
    setInput('');
    setIsLoading(true);

    // Add user message and skeleton loader immediately for better UX
    const skeletonId = (Date.now() + 1).toString();
    const skeletonMessage: SkeletonMessage = {
      id: skeletonId,
      type: 'skeleton',
      isAssistant: true
    };

    setMessages(prev => [...prev, userMessage, skeletonMessage]);

    try {
      // Try LangChain first if configured
      if (langChainService.configured) {
        const langChainResponse = await langChainService.processMessage(userInput);

        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: langChainResponse,
          timestamp: new Date(),
          status: 'success',
          reactions: [
            { emoji: '👍', count: 0, users: [] }
          ]
        };

        // Replace skeleton with actual message
        setMessages(prev => prev.map(msg =>
          msg.id === skeletonId
            ? assistantMessage
            : msg
        ));
        saveChatHistory(messages.filter(msg => msg.type !== 'skeleton').map(msg => msg.id === skeletonId ? assistantMessage : msg as Message));
        return;
      }

      // Fallback to pattern matching
      const parsed = parseUserInput(userInput);

      if (parsed) {
        const result = await callMCPTool(parsed.tool, parsed.data);
        const response = formatToolResponse(parsed.tool, result);

        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date(),
          status: 'success',
          toolUsed: parsed.tool,
          data: result,
          reactions: [
            { emoji: '👍', count: 0, users: [] }
          ]
        };

        // Replace skeleton with actual message
        setMessages(prev => prev.map(msg =>
          msg.id === skeletonId
            ? assistantMessage
            : msg
        ));
        saveChatHistory(messages.filter(msg => msg.type !== 'skeleton').map(msg => msg.id === skeletonId ? assistantMessage : msg as Message));
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: `Jeg forstod ikke din besked. Prøv at spørge om:

• "Valider 2025-10-21 som tirsdag"
• "Tjek konflikt 09:00-12:00"
• "Opret faktura"
• "Tjek overtid"
• "Hent kunde data"
• "Hjælp"`,
          timestamp: new Date(),
          status: 'success'
        };

        // Replace skeleton with actual message
        setMessages(prev => prev.map(msg =>
          msg.id === skeletonId
            ? assistantMessage
            : msg
        ));
        saveChatHistory(messages.filter(msg => msg.type !== 'skeleton').map(msg => msg.id === skeletonId ? assistantMessage : msg as Message));
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `❌ **Fejl opstod**\n\n${error instanceof Error ? error.message : 'Ukendt fejl'}\n\nTjek at MCP serveren kører på http://localhost:3001`,
        timestamp: new Date(),
        status: 'error'
      };

      // Replace skeleton with error message
      setMessages(prev => prev.map(msg =>
        msg.id === skeletonId
          ? errorMessage
          : msg
      ));
        saveChatHistory(messages.filter(msg => msg.type !== 'skeleton').map(msg => msg.id === skeletonId ? errorMessage : msg as Message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle file upload logic here
      console.log('Files selected:', files);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // Voice recording logic here
  };

  const handleExportChat = () => {
    const chatData = {
      messages: messages,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renos-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const filteredMessages = messages.filter(msg =>
    (msg as any).type === 'skeleton' ||
    ((msg as any).type !== 'skeleton' && (msg as Message).content.toLowerCase().includes(searchQuery.toLowerCase()))
  ) as (Message | SkeletonMessage)[];

  const renderSkeletonMessage = (skeleton: SkeletonMessage) => (
    <div className={`flex ${skeleton.isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-4xl ${skeleton.isAssistant ? 'order-1' : 'order-2'}`}>
        <div className="flex items-start space-x-2">
          {skeleton.isAssistant && (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
          <div className={`rounded-2xl px-4 py-3 shadow-sm animate-pulse transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gray-700 border border-gray-600'
              : 'bg-white border border-gray-200'
          }`}>
            <div className="space-y-2">
              <div className={`h-4 rounded w-48 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              <div className={`h-4 rounded w-32 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
              <div className={`h-4 rounded w-40 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessage = (message: Message) => (
    <div
      key={message.id}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-4xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
        <div className="flex items-start space-x-2">
          {message.type === 'assistant' && (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
          {message.type === 'user' && (
            <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <div className={`rounded-2xl px-4 py-3 shadow-sm transition-colors duration-300 ${
            message.type === 'user'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              : isDarkMode
                ? 'bg-gray-800 border border-gray-600 text-gray-100'
                : 'bg-white border border-gray-200 text-gray-900'
          }`}>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${message.type === 'user' ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString('da-DK')}
              </span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(message.status)}
                {message.toolUsed && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isDarkMode
                      ? 'bg-blue-900 text-blue-200'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {message.toolUsed}
                  </span>
                )}
              </div>
            </div>
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex items-center space-x-1 mt-2">
                {message.reactions.map((reaction, index) => (
                  <button
                    key={index}
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900'
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-sm border-b px-6 py-4 shadow-sm transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800/80 border-gray-700'
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                RenOS Calendar MCP
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Intelligent Kalender Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {isConnected ? 'Forbundet' : 'Afbrudt'}
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? 'text-yellow-500 bg-yellow-100 hover:bg-yellow-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isDarkMode ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
              aria-label={isDarkMode ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setShowPlugins(!showPlugins)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Plugin Manager"
            >
              <Plug className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTools(!showTools)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tools"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {searchQuery && (
        <div className={`px-6 py-2 border-b transition-colors duration-300 ${
          isDarkMode
            ? 'bg-yellow-900/20 border-yellow-700'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Search className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <span className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
              Søger efter: "{searchQuery}" ({filteredMessages.length} resultater)
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className={`${isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-600 hover:text-yellow-800'}`}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {filteredMessages.map((message) => (
          (message as any).type === 'skeleton'
            ? renderSkeletonMessage(message as SkeletonMessage)
            : renderMessage(message as Message)
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Tools Panel */}
      {showTools && (
        <div className={`border-t px-6 py-4 transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-800/80 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {availableTools.map((tool) => (
              <button
                key={tool.name}
                onClick={() => setInput(`${tool.icon || '🔧'} ${tool.description}`)}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700/50 hover:bg-gray-600/80 text-gray-300'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="text-2xl mb-1">{tool.icon || '🔧'}</span>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {tool.name}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Available
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plugin Manager Panel */}
      {showPlugins && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl w-4/5 h-4/5 max-w-6xl transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Plugin Manager
              </h2>
              <button
                onClick={() => setShowPlugins(false)}
                className={`transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="h-full">
              <PluginManager
                onToolSelect={(tool) => {
                  setInput(`Use ${tool.name}: `);
                  setShowPlugins(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`backdrop-blur-sm border-t px-6 py-4 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800/80 border-gray-700'
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex space-x-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Skriv din besked her... (Enter for at sende, Shift+Enter for ny linje)"
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 backdrop-blur-sm'
                    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 backdrop-blur-sm'
                }`}
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-3 flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? 'text-red-500 bg-red-100'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={`text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg transition-all duration-200 ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>Send</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {MCP_TOOLS.map((tool) => (
            <button
              key={tool.name}
              onClick={() => setInput(`${tool.icon} ${tool.description}`)}
              className={`text-xs px-3 py-1 rounded-full transition-colors backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-gray-700/50 hover:bg-gray-600/80 text-gray-300 border border-gray-600'
                  : 'bg-white/50 backdrop-blur-sm hover:bg-white/80 text-gray-700 border border-gray-200'
              }`}
            >
              {tool.icon} {tool.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
