import { useState, useEffect } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot,
  User,
  Zap,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hej! Jeg er JARVIS, TekUp's AI-assistent. Hvordan kan jeg hjælpe dig i dag?",
      timestamp: new Date()
    }
  ]);

  const quickActions = [
    "Se vores produkter",
    "Book et møde", 
    "Få et tilbud",
    "Support kontakt"
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      type: "user",
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Tak for din besked! Jeg videresender dig til vores konsulenter inden for 2 minutter.",
        "Det lyder spændende! Lad mig forbinde dig med vores tekniske team.",
        "Jeg kan hjælpe dig med det. Vil du booke et møde med vores specialister?",
        "Perfekt! Jeg sender dig information om vores løsninger på email."
      ];
      
      const botResponse = {
        type: "bot",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="rounded-full w-16 h-16 bg-neon-blue hover:bg-neon-blue/90 text-ecosystem-dark shadow-2xl neon-glow animate-pulse-neon"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] glass-card border-glass-border/30 rounded-2xl z-40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-glass-border/30 bg-gradient-to-r from-neon-blue/10 to-neon-cyan/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-blue/20 rounded-xl">
                <Bot className="w-6 h-6 text-neon-blue" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-foreground">JARVIS AI</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl ${
                  msg.type === 'user' 
                    ? 'bg-neon-blue text-ecosystem-dark' 
                    : 'glass border-glass-border/30'
                }`}>
                  <div className="flex items-start gap-2">
                    {msg.type === 'bot' && <Bot className="w-4 h-4 text-neon-blue mt-0.5" />}
                    {msg.type === 'user' && <User className="w-4 h-4 text-ecosystem-dark mt-0.5" />}
                    <div>
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span className="text-xs opacity-60">
                          {msg.timestamp.toLocaleTimeString('da-DK', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="glass border-glass-border/30 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-neon-blue" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-glass-border/30">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(action)}
                  className="text-xs p-2 glass border-glass-border/30 rounded-lg hover:bg-neon-blue/10 hover:border-neon-blue/30 text-muted-foreground hover:text-neon-blue transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Skriv din besked..."
                className="flex-1 p-3 glass border-glass-border/30 rounded-lg bg-dashboard-surface text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="bg-neon-blue hover:bg-neon-blue/90 text-ecosystem-dark px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;