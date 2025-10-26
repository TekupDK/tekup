'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '@/store/jarvis-store';

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export function useVoice() {
  const { 
    voice, 
    setListening, 
    setProcessing, 
    setSpeaking, 
    setAudioLevel,
    addMessage 
  } = useJarvisStore();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = voice.language === 'da' ? 'da-DK' : 'en-US';
        setIsSupported(true);
      }
      
      // Check for speech synthesis support
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, [voice.language]);

  // Setup audio visualization
  const setupAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const updateAudioLevel = () => {
        if (analyserRef.current && voice.isListening) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedLevel = Math.min(average / 128, 1);
          setAudioLevel(normalizedLevel);
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (err) {
      console.error('Error setting up audio visualization:', err);
      setError('Kunne ikke få adgang til mikrofon');
    }
  }, [voice.isListening, setAudioLevel]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognitionRef.current || voice.isListening) return;
    
    setError(null);
    setListening(true);
    
    await setupAudioVisualization();
    
    recognitionRef.current.onstart = () => {
      console.log('🎤 Voice recognition started');
    };
    
    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        addMessage({
          type: 'user',
          content: finalTranscript.trim(),
          metadata: { audioUrl: undefined }
        });
        stopListening();
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event);
      setError('Fejl i talegenkenning');
      setListening(false);
    };
    
    recognitionRef.current.onend = () => {
      setListening(false);
      setAudioLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Kunne ikke starte talegenkenning');
      setListening(false);
    }
  }, [voice.isListening, setListening, setupAudioVisualization, addMessage, setAudioLevel]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && voice.isListening) {
      recognitionRef.current.stop();
    }
    setListening(false);
    setAudioLevel(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [voice.isListening, setListening, setAudioLevel]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!synthRef.current || voice.isSpeaking) return;
    
    // Stop any current speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice.language === 'da' ? 'da-DK' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => {
      setSpeaking(true);
    };
    
    utterance.onend = () => {
      setSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [voice.isSpeaking, voice.language, setSpeaking]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setSpeaking(false);
    currentUtteranceRef.current = null;
  }, [setSpeaking]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (voice.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [voice.isListening, startListening, stopListening]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current && voice.isListening) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [voice.isListening]);

  return {
    isSupported,
    isListening: voice.isListening,
    isProcessing: voice.isProcessing,
    isSpeaking: voice.isSpeaking,
    audioLevel: voice.audioLevel,
    language: voice.language,
    error,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
  };
}