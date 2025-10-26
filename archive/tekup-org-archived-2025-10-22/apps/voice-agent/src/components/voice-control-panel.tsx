'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceStore } from '@/store/voice-store';

export const VoiceControlPanel: React.FC = () => {
  const { 
    isListening, 
    startListening, 
    stopListening, 
    audioLevel, 
    setAudioLevel 
  } = useVoiceStore();
  
  // Simuler audio level for demo
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 100));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening, setAudioLevel]);
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  return (
    <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-8">
      <div className="text-center space-y-6">
        {/* Main Voice Button - TekUp Brand */}
        <div className="relative">
          <button 
            onClick={toggleListening}
            className={`
              relative w-32 h-32 rounded-full transition-all duration-300 
              ${isListening 
                ? 'bg-brand shadow-lg shadow-brand/30 scale-110' 
                : 'bg-neutral-700 hover:bg-neutral-600 hover:scale-105'
              }
              border-4 border-neutral-600 hover:border-brand/50
            `}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">
                {isListening ? '🔄' : '🎤'}
              </span>
            </div>
            
            {/* Listening Animation */}
            {isListening && (
              <div className="absolute inset-0 rounded-full animate-ping bg-brand/30"></div>
            )}
          </button>
          
          {/* Status Text */}
          <div className="mt-4">
            <p className="text-lg font-medium text-neutral-200">
              {isListening ? 'Lytter...' : 'Tryk for at starte'}
            </p>
            <p className="text-sm text-neutral-400">
              {isListening ? 'Tal nu til din AI assistent' : 'Voice Agent klar'}
            </p>
          </div>
        </div>
        
        {/* Audio Level Indicator */}
        {isListening && (
          <div className="max-w-md mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-sm text-neutral-400">Lydniveau</span>
              <span className="text-sm font-medium text-brand">{audioLevel}%</span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div 
                className="bg-brand h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Voice Instructions */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-neutral-700 rounded-lg p-4 border border-neutral-600">
            <h3 className="text-sm font-medium text-neutral-200 mb-2">
              💡 Voice Kommandoer
            </h3>
            <p className="text-xs text-neutral-400">
              Prøv at sige: "vis alle leads", "start backup", "kør compliance check", 
              eller "skift til rendetalje"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};