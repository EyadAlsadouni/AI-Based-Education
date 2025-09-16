'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RealtimeSession {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  currentTranscript: string;
  lastResponse: string;
  error: string | null;
  connect: (userId: number, sessionId: string) => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => void;
  bargeIn: () => void;
  clearError: () => void;
}

interface RealtimeMessage {
  type: string;
  [key: string]: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001/api';

export const useOpenAIRealtime = (): RealtimeSession => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingAudioRef = useRef(false);

  // Initialize audio context
  const initAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      setError('Failed to initialize audio system');
    }
  }, []);

  // Connect to OpenAI Realtime API via our backend
  const connect = useCallback(async (userId: number, sessionId: string) => {
    try {
      setError(null);
      
      // Get realtime session token from backend
      console.log('Fetching realtime token from backend...');
      const response = await fetch(`${API_BASE_URL}/voice/realtime-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, session_id: sessionId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get realtime token:', response.status, errorText);
        throw new Error(`Failed to get realtime session token: ${response.status} ${errorText}`);
      }

      const { token, ws_url, model } = await response.json();
      console.log('Received proxy connection info, connecting to:', ws_url);

      if (!ws_url) {
        throw new Error('Invalid WebSocket URL from backend');
      }

      // Initialize audio context
      await initAudioContext();

      // Connect to our backend proxy (ChatGPT pattern - simple connection)
      console.log('Connecting to proxy WebSocket...');
      wsRef.current = new WebSocket(ws_url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        
        // Wait a bit before sending session configuration
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('Sending session configuration...');
            // Send session update to configure the session
            wsRef.current.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: `You are a helpful health coach for a patient education platform. 
                  Provide warm, supportive responses in a 6th-grade reading level. 
                  Keep responses brief (30-60 seconds of speech).
                  Always ground your responses in the user's dashboard and profile data when available.
                  Never provide medical diagnosis or dosing advice.
                  If asked about emergencies, immediately recommend contacting emergency services.`,
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 500
                },
                tools: [
                  {
                    type: 'function',
                    name: 'get_user_context',
                    description: 'Get user dashboard, profile, and knowledge base context for grounded responses',
                    parameters: {
                      type: 'object',
                      properties: {
                        query: {
                          type: 'string',
                          description: 'The user query to search context for'
                        }
                      },
                      required: ['query']
                    }
                  }
                ]
              }
            }));
          }
        }, 200); // Small delay to ensure connection is ready
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          console.log('Received WebSocket message:', message.type, message);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data);
          setError('Failed to parse response from Voice Coach');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error details:', error);
        setError('Voice Coach connection error');
        setIsConnected(false);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        if (event.code === 1006) {
          setError('Connection lost unexpectedly. Please check your internet connection.');
        } else if (event.code === 1008) {
          setError('Authentication failed. Please refresh and try again.');
        } else if (event.code !== 1000 && event.code !== 1001) {
          setError(`Connection closed with error (${event.code}): ${event.reason || 'Unknown reason'}`);
        }
        
        setIsConnected(false);
        setIsListening(false);
        setIsProcessing(false);
        setIsPlaying(false);
      };

    } catch (error) {
      console.error('Error connecting to Realtime API:', error);
      setError('Failed to connect to Voice Coach');
    }
  }, [initAudioContext]);

  // Handle messages from OpenAI Realtime API
  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    try {
      switch (message.type) {
        case 'session.created':
          console.log('Realtime session created');
          break;

        case 'session.updated':
          console.log('Realtime session updated');
          break;

        case 'input_audio_buffer.speech_started':
          setIsListening(true);
          setCurrentTranscript('');
          break;

        case 'input_audio_buffer.speech_stopped':
          setIsListening(false);
          setIsProcessing(true);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          setCurrentTranscript(message.transcript || '');
          break;

        case 'response.created':
          setIsProcessing(true);
          break;

        case 'response.audio.delta':
          // Queue audio chunks for playback
          if (message.delta) {
            queueAudioChunk(message.delta);
          }
          break;

        case 'response.audio.done':
          setIsProcessing(false);
          break;

        case 'response.text.delta':
          setLastResponse(prev => prev + (message.delta || ''));
          break;

        case 'response.text.done':
          setLastResponse(message.text || '');
          break;

        case 'response.function_call_arguments.delta':
          // Handle function call for RAG context
          break;

        case 'response.function_call_arguments.done':
          if (message.name === 'get_user_context') {
            handleContextRequest(message.arguments);
          }
          break;

        case 'error':
          const errorDetails = message.error || message;
          const errorMessage = errorDetails?.message || 
                              errorDetails?.code || 
                              JSON.stringify(errorDetails) || 
                              'Unknown API error';
          console.error('Realtime API error details:', {
            type: message.type,
            error: errorDetails,
            fullMessage: message
          });
          setError(`OpenAI Realtime API error: ${errorMessage}`);
          break;

        default:
          console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling realtime message:', error);
      setError('Failed to process response');
    }
  }, []);

  // Queue and play audio chunks
  const queueAudioChunk = useCallback(async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        console.warn('Audio context not available');
        return;
      }

      // Decode base64 audio data
      const binaryString = atob(base64Audio);
      const audioData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioData[i] = binaryString.charCodeAt(i);
      }
      
      // Convert PCM16 data to AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < channelData.length; i++) {
        const sample = (audioData[i * 2] | (audioData[i * 2 + 1] << 8));
        channelData[i] = sample < 32768 ? sample / 32768 : (sample - 65536) / 32768;
      }
      
      audioQueueRef.current.push(audioBuffer);
      
      if (!isPlayingAudioRef.current) {
        playNextAudioChunk();
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      // Don't set error state for individual audio chunk failures
    }
  }, []);

  // Play audio chunks sequentially
  const playNextAudioChunk = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      setIsPlaying(false);
      return;
    }

    const audioBuffer = audioQueueRef.current.shift();
    if (!audioBuffer || !audioContextRef.current) return;

    isPlayingAudioRef.current = true;
    setIsPlaying(true);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      playNextAudioChunk();
    };

    source.start();
  }, []);

  // Handle context requests from the model
  const handleContextRequest = useCallback(async (args: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/voice/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args),
      });

      const contextData = await response.json();
      
      // Send context back to the model
      wsRef.current?.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: args.call_id,
          output: JSON.stringify(contextData)
        }
      }));
    } catch (error) {
      console.error('Error fetching context:', error);
    }
  }, []);

  // Start audio input
  const startListening = useCallback(async () => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setError('Not connected to Voice Coach');
        return;
      }

      if (!audioContextRef.current) {
        await initAudioContext();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Use Web Audio API to process audio into PCM16 format
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const uint8Array = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Audio = btoa(binary);
        
        // Send audio data
        wsRef.current?.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio
        }));
      };

      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);

      // Store references for cleanup
      (mediaRecorderRef as any).current = {
        stream,
        source,
        processor,
        disconnect: () => {
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach(track => track.stop());
        }
      };

      setIsListening(true);

    } catch (error) {
      console.error('Error starting audio input:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [initAudioContext]);

  // Stop audio input
  const stopListening = useCallback(() => {
    if ((mediaRecorderRef as any).current && typeof (mediaRecorderRef as any).current.disconnect === 'function') {
      (mediaRecorderRef as any).current.disconnect();
      (mediaRecorderRef as any).current = null;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    }
    
    setIsListening(false);
  }, []);

  // Send text input
  const sendText = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send text');
      setError('Not connected to Voice Coach');
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: text
            }
          ]
        }
      }));

      wsRef.current.send(JSON.stringify({
        type: 'response.create'
      }));

      setCurrentTranscript(text);
      setIsProcessing(true);
    } catch (error) {
      console.error('Error sending text:', error);
      setError('Failed to send message');
    }
  }, []);

  // Barge-in (interrupt current playback)
  const bargeIn = useCallback(() => {
    try {
      // Stop current audio playback
      audioQueueRef.current = [];
      isPlayingAudioRef.current = false;
      setIsPlaying(false);

      // Cancel current response
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'response.cancel'
        }));
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Error during barge-in:', error);
      setIsProcessing(false);
      setIsPlaying(false);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    
    setIsConnected(false);
    setIsListening(false);
    setIsProcessing(false);
    setIsPlaying(false);
    setCurrentTranscript('');
    setLastResponse('');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
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
    isPlaying,
    currentTranscript,
    lastResponse,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
    bargeIn,
    clearError
  };
};