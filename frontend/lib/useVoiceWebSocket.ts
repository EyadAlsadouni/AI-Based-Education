'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WSMessage, WSAudioChunk, WSTextResponse, WSASRResult } from '../types';
import { voiceApi } from './api';

export interface VoiceWebSocketHook {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  lastResponse: string;
  audioQueue: string[];
  error: string | null;
  connect: (userId: number, sessionId: string) => void;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => void;
  sendAudioChunk: (audioData: string) => void;
  bargeIn: () => void;
  clearError: () => void;
}

export const useVoiceWebSocket = (): VoiceWebSocketHook => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const audioChunksRef = useRef<Map<number, string>>(new Map());
  const totalChunksRef = useRef<number>(0);

  const connect = useCallback((userId: number, sessionId: string) => {
    try {
      const wsUrl = voiceApi.getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Initialize session
        wsRef.current?.send(JSON.stringify({
          type: 'init_session',
          user_id: userId,
          session_id: sessionId
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
          setError('Failed to parse server message');
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsListening(false);
        setIsProcessing(false);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to connect to Voice Coach');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsProcessing(false);
    setCurrentTranscript('');
    setAudioQueue([]);
    audioChunksRef.current.clear();
  }, []);

  const startListening = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_listening' }));
      setCurrentTranscript('');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_listening' }));
    }
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'text_input', 
        text 
      }));
      setIsProcessing(true);
    }
  }, []);

  const sendAudioChunk = useCallback((audioData: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'audio_chunk', 
        audio: audioData 
      }));
    }
  }, []);

  const bargeIn = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'barge_in' }));
      setAudioQueue([]); // Clear audio queue
      audioChunksRef.current.clear();
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    console.log('WebSocket message:', message.type);
    
    switch (message.type) {
      case 'session_ready':
        console.log('Voice Coach session ready');
        break;
        
      case 'listening_started':
        setIsListening(true);
        break;
        
      case 'listening_stopped':
        setIsListening(false);
        break;
        
      case 'asr_partial':
        const partialResult = message as WSASRResult;
        setCurrentTranscript(partialResult.transcript);
        break;
        
      case 'asr_final':
        const finalResult = message as WSASRResult;
        setCurrentTranscript(finalResult.transcript);
        setIsListening(false);
        setIsProcessing(true);
        break;
        
      case 'processing_started':
        setIsProcessing(true);
        break;
        
      case 'answer_final':
        const response = message as WSTextResponse;
        setLastResponse(response.text);
        setIsProcessing(false);
        break;
        
      case 'audio_start':
        totalChunksRef.current = message.total_chunks;
        audioChunksRef.current.clear();
        break;
        
      case 'audio_chunk':
        const audioChunk = message as WSAudioChunk;
        audioChunksRef.current.set(audioChunk.chunk_index, audioChunk.audio_data);
        
        if (audioChunk.is_final) {
          // Reconstruct complete audio from chunks
          let completeAudio = '';
          for (let i = 0; i < totalChunksRef.current; i++) {
            completeAudio += audioChunksRef.current.get(i) || '';
          }
          
          if (completeAudio) {
            setAudioQueue(prev => [...prev, completeAudio]);
          }
          
          audioChunksRef.current.clear();
        }
        break;
        
      case 'audio_stop':
        setAudioQueue([]);
        audioChunksRef.current.clear();
        break;
        
      case 'error':
        setError(message.message || 'An error occurred');
        setIsListening(false);
        setIsProcessing(false);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isProcessing,
    currentTranscript,
    lastResponse,
    audioQueue,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
    sendAudioChunk,
    bargeIn,
    clearError
  };
};