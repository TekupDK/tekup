'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'da-DK'; // Danish language
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="flex items-end space-x-2 max-w-4xl mx-auto">
      <button
        onClick={handleVoiceInput}
        disabled={disabled || isRecording}
        className={`p-3 rounded-lg transition-colors ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Voice input (Danish)"
      >
        <Mic className="w-5 h-5" />
      </button>

      <button
        disabled={disabled}
        className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        title="Attach file (coming soon)"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your Tekup portfolio..."
        disabled={disabled}
        rows={1}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
      />

      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        title="Send message (Enter)"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
