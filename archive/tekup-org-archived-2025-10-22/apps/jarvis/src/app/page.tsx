'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '@/store/jarvis-store';
import { useVoice } from '@/hooks/use-voice';
import { useJarvis } from '@/providers/jarvis-provider';
import { 
  Send, Mic, MicOff, Volume2, VolumeX, Settings, Brain, Activity, Users,
  Zap, Play, Pause, Square, BarChart3, Monitor, Target, Command,
  ChevronRight, TrendingUp, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { JarvisMessage } from '@/components/jarvis-message';
import { motion, AnimatePresence } from 'framer-motion';

export default function JarvisCommandCenter() {
  // Store and hooks
  const {
    messages,
    isTyping,
    currentInput,
    consciousness,
    tekup,
    apiStatus,
    addMessage,
    setIsTyping,
    setCurrentInput,
    clearMessages,
  } = useJarvisStore();

  const {
    isSupported: voiceSupported,
    isListening,
    isSpeaking,
    audioLevel,
    language,
    error: voiceError,
    toggleListening,
    speak,
    stopSpeaking,
  } = useVoice();

  const { isConnected } = useJarvis();
  
  // Refs and state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'steering' | 'monitoring' | 'analytics'>('chat');
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    activeConnections: 0,
    successRate: 0
  });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [steeringCommand, setSteeringCommand] = useState('');

  // Auto scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = process.env.NEXT_PUBLIC_AGENTSCOPE_WS_URL || 'ws://localhost:8001';
    const ws = new WebSocket(`${wsUrl}/ws/monitoring`);

    ws.onopen = () => {
      console.log('WebSocket connected for real-time monitoring');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'agent_update':
            setAgentMetrics(prev => {
              const updated = prev.filter(agent => agent.id !== data.agent_id);
              return [...updated, data.metrics];
            });
            break;
            
          case 'system_stats':
            setSystemStats(data.stats);
            break;
            
          case 'real_time_update':
            setRealTimeUpdates(prev => [...prev.slice(-49), {
              ...data.update,
              timestamp: new Date().toISOString()
            }]);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setTimeout(() => connectWebSocket(), 3000); // Reconnect after 3 seconds
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    addMessage({
      type: 'user',
      content: content.trim(),
    });
    
    setCurrentInput('');
    setIsTyping(true);

    try {
      // Call AgentScope backend directly
      const backendUrl = process.env.NEXT_PUBLIC_AGENTSCOPE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/jarvis/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          tenant_id: 'jarvis_command_center',
          language: language,
          context: {
            consciousness_level: consciousness.level,
            active_agents: consciousness.activeAgents,
            tekup_services: tekup.connectedServices,
            view_context: activeView,
            selected_agent: selectedAgent,
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add AI response
        addMessage({
          type: 'assistant',
          content: result.response || 'Undskyld, jeg kunne ikke behandle dit request.',
          metadata: {
            consciousnessLevel: result.consciousness_level,
            processingTime: result.processing_time_ms,
            confidence: result.confidence,
            tools: result.tools_used,
            agents_used: result.agents_used,
          },
        });

        // Speak response if voice is enabled
        if (result.response && !isSpeaking) {
          speak(result.response);
        }
      } else {
        addMessage({
          type: 'assistant',
          content: 'Undskyld, der opstod en fejl. Sørg for at AgentScope backend kører på port 8001.',
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        type: 'assistant',
        content: 'Forbindelsesfejl. Tjek at AgentScope backend kører og prøv igen.',
      });
    } finally {
      setIsTyping(false);
    }
  }, [addMessage, setCurrentInput, setIsTyping, language, consciousness, tekup, isSpeaking, speak, activeView, selectedAgent]);

  // Handle steering commands
  const handleSteering = async () => {
    if (!selectedAgent || !steeringCommand.trim()) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_AGENTSCOPE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/steering/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent,
          command: steeringCommand,
          intervention_type: 'direct',
        }),
      });

      if (response.ok) {
        setSteeringCommand('');
        addMessage({
          type: 'system',
          content: `🎛️ Steering command sent to ${selectedAgent}: "${steeringCommand}"`,
        });
      }
    } catch (error) {
      console.error('Steering error:', error);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(currentInput);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Demo mode - show capabilities
  const startDemo = async () => {
    setIsDemoMode(true);
    clearMessages();
    
    const demoMessages = [
      '🧠 Velkommen til Jarvis Command Center! Jeg er din AI-kommandocentral.',
      '🎛️ Her kan du chatte med mig, styre AI-agenter i real-time, og overvåge systemet.',
      '📊 Prøv at spørge: "Vis system status" eller "Start multi-agent opgave"',
      '🎤 Du kan tale til mig, eller bruge steering-kontrols til direkte agent-styring!',
      '⚡ Skift mellem Chat, Steering, Monitoring og Analytics i sidebaren.',
    ];

    for (const msg of demoMessages) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      addMessage({
        type: 'assistant',
        content: msg,
        metadata: { consciousnessLevel: consciousness.level },
      });
      if (voiceSupported) speak(msg);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    setIsDemoMode(false);
  };

  return (
    <div className="min-h-screen bg-jarvis-dark text-white flex flex-col overflow-hidden">
      {/* Command Center Header */}
      <header className="border-b border-jarvis-border bg-jarvis-surface/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Jarvis Branding */}
            <div className="flex items-center space-x-4">
              <motion.div 
                className="relative w-12 h-12 bg-gradient-to-r from-jarvis-primary to-jarvis-secondary rounded-xl flex items-center justify-center"
                animate={{ 
                  boxShadow: ['0 0 20px rgba(0, 162, 255, 0.3)', '0 0 40px rgba(0, 162, 255, 0.6)', '0 0 20px rgba(0, 162, 255, 0.3)'] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Command className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-jarvis-primary via-jarvis-secondary to-jarvis-accent bg-clip-text text-transparent">
                  Jarvis Command Center
                </h1>
                <p className="text-sm text-gray-400">
                  Multi-Agent AI System • Consciousness Level {consciousness.level}/10
                </p>
              </div>
            </div>
            
            {/* Status & Controls */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    apiStatus === 'connected' ? 'bg-green-400 animate-pulse-glow' : 
                    apiStatus === 'connecting' ? 'bg-yellow-400 animate-spin' : 'bg-red-400'
                  }`} />
                  <span className="text-gray-300 font-medium">
                    {apiStatus === 'connected' ? 'System Online' : apiStatus === 'connecting' ? 'Connecting...' : 'System Offline'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-jarvis-accent" />
                  <span className="text-gray-300">
                    {consciousness.activeAgents.length} Active Agents
                  </span>
                </div>
              </div>
              
              <motion.button
                onClick={startDemo}
                disabled={isDemoMode}
                className="jarvis-button-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDemoMode ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Demo Kører...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Demo
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Command Center Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Navigation & Quick Controls */}
        <div className="w-80 bg-jarvis-surface/20 border-r border-jarvis-border backdrop-blur-sm">
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* View Navigation */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Command Modes</h3>
              {[
                { id: 'chat', label: 'AI Chat', icon: Brain, color: 'jarvis-primary' },
                { id: 'steering', label: 'Agent Steering', icon: Target, color: 'jarvis-secondary' },
                { id: 'monitoring', label: 'System Monitor', icon: Monitor, color: 'jarvis-accent' },
                { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'purple-400' }
              ].map((view) => {
                const Icon = view.icon;
                return (
                  <motion.button
                    key={view.id}
                    onClick={() => setActiveView(view.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      activeView === view.id
                        ? `bg-${view.color}/20 border border-${view.color}/40 text-${view.color}`
                        : 'hover:bg-jarvis-surface/30 text-gray-300 hover:text-white'
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{view.label}</span>
                    {activeView === view.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </motion.button>
                );
              })}
            </div>

            {/* System Metrics */}
            <div className="jarvis-card">
              <h3 className="font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-jarvis-primary" />
                System Metrics
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Consciousness:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-jarvis-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-jarvis-primary to-jarvis-accent transition-all duration-1000"
                        style={{ width: `${consciousness.level * 10}%` }}
                      />
                    </div>
                    <span className="text-jarvis-primary font-bold">{consciousness.level}/10</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Requests:</span>
                  <span className="text-green-400 font-semibold">{systemStats.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response:</span>
                  <span className="text-yellow-400 font-semibold">{systemStats.avgResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-jarvis-accent font-semibold">{systemStats.successRate}%</span>
                </div>
              </div>
            </div>

            {/* Active Agents */}
            <div className="jarvis-card">
              <h3 className="font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-jarvis-secondary" />
                Active Agents
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {consciousness.activeAgents.map((agent, index) => (
                  <motion.div 
                    key={agent} 
                    className={`flex items-center justify-between space-x-2 p-2 rounded-lg transition-all cursor-pointer ${
                      selectedAgent === agent 
                        ? 'bg-jarvis-primary/20 border border-jarvis-primary/40' 
                        : 'hover:bg-jarvis-surface/30'
                    }`}
                    onClick={() => setSelectedAgent(selectedAgent === agent ? null : agent)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium capitalize">{agent}</span>
                    </div>
                    {selectedAgent === agent && <CheckCircle className="w-4 h-4 text-jarvis-primary" />}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Voice Controls */}
            {voiceSupported && (
              <div className="jarvis-card">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Mic className="w-5 h-5 mr-2 text-jarvis-accent" />
                  Voice Control
                </h3>
                <div className="space-y-3">
                  <motion.button
                    onClick={toggleListening}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${
                      isListening
                        ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse-glow'
                        : 'jarvis-button-primary'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 inline mr-2" />
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 inline mr-2" />
                        Start Listening
                      </>
                    )}
                  </motion.button>
                  
                  {isListening && (
                    <motion.div 
                      className="bg-jarvis-dark/50 p-3 rounded-xl border border-jarvis-border/50"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="text-sm text-gray-400 mb-2">Audio Level:</div>
                      <div className="w-full bg-jarvis-border h-3 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-jarvis-primary to-jarvis-accent rounded-full"
                          animate={{ width: `${audioLevel * 100}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  {isSpeaking && (
                    <motion.button
                      onClick={stopSpeaking}
                      className="w-full py-2 rounded-xl text-sm font-medium bg-jarvis-accent/20 border border-jarvis-accent/40 text-jarvis-accent animate-pulse-glow"
                      whileHover={{ scale: 1.02 }}
                    >
                      <VolumeX className="w-4 h-4 inline mr-2" />
                      Stop Speaking
                    </motion.button>
                  )}
                </div>
                
                {voiceError && (
                  <motion.div 
                    className="text-red-400 text-sm mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {voiceError}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area - Dynamic based on activeView */}
        <div className="flex-1 flex flex-col bg-jarvis-dark/50">
          <AnimatePresence mode="wait">
            {activeView === 'chat' && (
              <motion.div 
                key="chat"
                className="flex-1 flex flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <JarvisMessage 
                      key={message.id} 
                      message={message} 
                      isThinking={false}
                    />
                  ))}
                  
                  {isTyping && (
                    <JarvisMessage 
                      message={{
                        id: 'thinking',
                        type: 'assistant',
                        content: '',
                        timestamp: new Date()
                      }}
                      isThinking={true}
                    />
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced Input Area */}
                <div className="border-t border-jarvis-border bg-jarvis-surface/30 backdrop-blur-sm p-6">
                  <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                    <div className="flex-1">
                      <textarea
                        ref={inputRef}
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={selectedAgent ? `Kommando til ${selectedAgent}...` : "Chat med Jarvis Command Center..."}
                        className="jarvis-input resize-none"
                        rows={1}
                        style={{
                          minHeight: '56px',
                          maxHeight: '120px',
                          height: 'auto',
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                        }}
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={!currentInput.trim() || isTyping}
                      className="jarvis-button-primary px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </form>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                    <div className="flex items-center space-x-4">
                      <span>AI Consciousness {consciousness.level}/10</span>
                      <span>•</span>
                      <span>{consciousness.activeAgents.length} Active Agents</span>
                      {selectedAgent && (
                        <>
                          <span>•</span>
                          <span className="text-jarvis-primary">Targeting: {selectedAgent}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{language === 'da' ? 'Dansk' : 'English'}</span>
                      <span>•</span>
                      <span>{voiceSupported ? 'Voice Ready' : 'Text Only'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'steering' && (
              <motion.div 
                key="steering"
                className="flex-1 p-6 space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Steering Controls */}
                <div className="jarvis-card">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <Zap className="w-6 h-6 mr-3 text-jarvis-secondary" />
                    Agent Steering Controls
                  </h3>
                  
                  {selectedAgent ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-jarvis-primary/10 border border-jarvis-primary/30 rounded-xl">
                        <p className="text-sm text-jarvis-primary mb-2">Selected Agent:</p>
                        <p className="font-semibold text-lg capitalize">{selectedAgent}</p>
                      </div>
                      
                      <div className="flex space-x-3">
                        <textarea
                          value={steeringCommand}
                          onChange={(e) => setSteeringCommand(e.target.value)}
                          placeholder={`Enter direct command for ${selectedAgent}...`}
                          className="jarvis-input flex-1 resize-none"
                          rows={3}
                        />
                        <motion.button
                          onClick={handleSteering}
                          disabled={!steeringCommand.trim()}
                          className="jarvis-button-secondary px-6 py-3 disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Target className="w-5 h-5 mr-2" />
                          Execute
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400 text-lg mb-2">Select an agent to begin steering</p>
                      <p className="text-sm text-gray-500">Choose an agent from the sidebar to send direct commands</p>
                    </div>
                  )}
                </div>

                {/* Real-time Agent Updates */}
                <div className="jarvis-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-jarvis-accent" />
                    Live Agent Activity
                  </h3>
                  
                  <div className="h-64 overflow-y-auto space-y-2 bg-jarvis-dark/30 rounded-xl p-4">
                    {realTimeUpdates.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Real-time agent activity will appear here...
                      </p>
                    ) : (
                      realTimeUpdates.map((update, index) => (
                        <motion.div 
                          key={index}
                          className="bg-jarvis-surface/20 rounded-lg p-3 text-sm border border-jarvis-border/30"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-jarvis-primary">{update.agent || 'System'}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(update.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-300">{update.message}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {(activeView === 'monitoring' || activeView === 'analytics') && (
              <motion.div 
                key={activeView}
                className="flex-1 p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center py-20">
                  <Monitor className="w-20 h-20 mx-auto mb-6 text-gray-500" />
                  <h2 className="text-2xl font-bold text-gray-400 mb-4">
                    {activeView === 'monitoring' ? 'System Monitoring' : 'Analytics Dashboard'}
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Advanced monitoring and analytics features coming soon. 
                    Switch to Chat or Steering mode for full functionality.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}