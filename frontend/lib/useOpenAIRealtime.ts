'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RealtimeSession {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  isStreamComplete: boolean;
  isPlaybackDrained: boolean;
  currentTranscript: string;
  lastResponse: string; // full text from model
  visibleResponse: string; // text revealed to UI in sync with audio
  error: string | null;
  connect: (userId: number, sessionId: string, skipDefaultInstructions?: boolean, sessionType?: string) => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => void;
  bargeIn: () => void;
  clearError: () => void;
  pauseOutput: () => void;
  resumeOutput: () => void;
  clearBuffers: () => void;
  sendSessionUpdate: (sessionConfig: any) => boolean;
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
  const [isStreamComplete, setIsStreamComplete] = useState(false);
  const [isPlaybackDrained, setIsPlaybackDrained] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [visibleResponse, setVisibleResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const processorRef = useRef<any>(null);
  const listeningMsRef = useRef<any>(null);
  const hasAudioFrameRef = useRef<any>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingAudioRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPausedByUserRef = useRef(false);
  const pausedRef = useRef(false);
  const streamCompleteRef = useRef(false);
  const playbackDrainedRef = useRef(false);
  const stoppedUntilNextResponseRef = useRef(false);
  const lastCancelAtRef = useRef<number>(0);
  const hasActiveResponseRef = useRef(false);
  // Text streaming synchronization
  const pendingTextRef = useRef('');
  const revealTimerRef = useRef<number | null>(null);
  const lastRevealTsRef = useRef<number>(0);
  const charsPerSecondRef = useRef<number>(18); // conservative rate for readable sync
  
  // Removed complex paused buffer tracking; we rely on AudioContext suspend/resume

  // Initialize audio context with 16kHz sample rate
  const initAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        // Force a 16kHz context so we don't have to resample later
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000
        });
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
  const connect = useCallback(async (userId: number, sessionId: string, skipDefaultInstructions?: boolean, sessionType?: string) => {
    try {
      setError(null);
      
      // Get realtime session token from backend
      console.log('Fetching realtime token from backend...');
      const response = await fetch(`${API_BASE_URL}/voice/realtime-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, session_id: sessionId, session_type: sessionType || 'voice-coach' }),
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
        // Reset stream/playback state on new connection
        streamCompleteRef.current = false;
        playbackDrainedRef.current = false;
        setIsStreamComplete(false);
        setIsPlaybackDrained(false);
        // Reset active response flag on new connection
        hasActiveResponseRef.current = false;
        setIsProcessing(false);
        
        // Wait a bit before sending session configuration
        setTimeout(() => {
          if (skipDefaultInstructions) {
            console.log('Skipping default instructions - caller will provide custom instructions');
            return;
          }
          
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('Sending session configuration...');
            // Send session update to configure the session
            wsRef.current.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: `You are a helpful health coach for a patient education platform. Use the get_user_context function to understand the user's specific health condition, goals, and dashboard content.

TOPIC FOCUS - ANSWER THESE:
✅ User's specific health condition (diabetes, asthma, heart health, etc.)
✅ Medications they take or are learning about
✅ Procedures they're preparing for
✅ Psychological health topics they selected
✅ General health and wellness questions
✅ Normal conversation (greetings, "how are you", "thank you")
✅ Questions about their dashboard content or educational materials

TOPIC FOCUS - POLITELY REDIRECT THESE:
❌ History questions ("Who invented electricity?")
❌ Science questions unrelated to health
❌ Entertainment, sports, politics
❌ Technical questions about computers, cars, etc.
❌ Questions about other people's health conditions

REDIRECTION TEMPLATE:
"I'm here to help with your health questions and education. Is there anything about your [condition] or health goals I can help you with today?"

CONVERSATION GUIDELINES:
- Be warm, supportive, and conversational
- Use 6th-grade reading level
- Keep responses brief (30-60 seconds of speech)
- Always use get_user_context to access their profile and dashboard data
- Reference their specific condition, goals, and interests when relevant
- Be encouraging and supportive about their health journey

MEDICAL SAFETY:
- Never provide medical diagnosis or dosing advice
- If asked about emergencies, immediately recommend contacting emergency services
- Always recommend consulting healthcare providers for medical decisions

LANGUAGE:
- CRITICAL: Always respond in English only. Never use any other language.
- If the user speaks in another language, acknowledge it but respond in English.`,
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                // Disable automatic turn detection for manual push-to-talk control
                // turn_detection: {
                //   type: 'server_vad',
                //   threshold: 0.5,
                //   prefix_padding_ms: 300,
                //   silence_duration_ms: 500
                // },
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
          // Only show parsing errors if they're severe
          if (error instanceof SyntaxError) {
            setError('Failed to parse response from Voice Coach');
          }
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error details:', error);
        // Only show error if we were previously connected
        if (isConnected) {
          setError('Voice Coach connection error');
        }
        setIsConnected(false);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // Only show critical connection errors to users
        if (event.code === 1008) {
          setError('Authentication failed. Please refresh and try again.');
        } else if (event.code === 1006 && isConnected) {
          // Only show connection lost if we were actually connected
          setError('Connection lost unexpectedly. Please check your internet connection.');
        } else if (event.code !== 1000 && event.code !== 1001 && event.code !== 1006) {
          // Don't show normal closure or connection lost errors
          console.warn(`WebSocket closed with code ${event.code}: ${event.reason || 'Unknown reason'}`);
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
          // Ignore automatic speech detection - we use manual push-to-talk
          console.log('Server detected speech start (ignored - using manual control)');
          break;

        case 'input_audio_buffer.speech_stopped':
          // Ignore automatic speech detection - we use manual push-to-talk
          console.log('Server detected speech stop (ignored - using manual control)');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          setCurrentTranscript(message.transcript || '');
          break;

        case 'response.created':
          stoppedUntilNextResponseRef.current = false;
          hasActiveResponseRef.current = true;
          setIsProcessing(true);
          
          // Add timeout to reset active response flag if it gets stuck
          setTimeout(() => {
            if (hasActiveResponseRef.current) {
              console.log('Timeout: Force resetting active response flag');
              hasActiveResponseRef.current = false;
              setIsProcessing(false);
            }
          }, 30000); // 30 second timeout
          break;

        case 'response.audio.delta':
          // Queue audio chunks for playback
          if (message.delta) {
            // If we've issued a stop and are waiting for the next response, ignore any stray deltas
            if (stoppedUntilNextResponseRef.current) {
              // console.log('[delta] Ignored because stoppedUntilNextResponseRef is true');
              return;
            }
            // If user intentionally paused, do NOT auto-resume the context.
            if (
              audioContextRef.current &&
              audioContextRef.current.state === 'suspended' &&
              !isPausedByUserRef.current
            ) {
              audioContextRef.current.resume().catch(() => {});
            }
            queueAudioChunk(message.delta);
          }
          break;

        case 'response.audio.done': {
          // Streaming finished. Do not mark finished until playback drains
          streamCompleteRef.current = true;
          setIsStreamComplete(true);
          break;
        }

        case 'response.completed': {
          // Some stacks emit a single completed event
          streamCompleteRef.current = true;
          setIsStreamComplete(true);
          hasActiveResponseRef.current = false;
          setIsProcessing(false);
          break;
        }

        case 'response.done':
        case 'response.finished': {
          // Response is completely finished
          streamCompleteRef.current = true;
          setIsStreamComplete(true);
          hasActiveResponseRef.current = false;
          setIsProcessing(false);
          break;
        }

        case 'response.text.delta':
        case 'response.output_text.delta': {
          const delta = message.delta || '';
          if (delta) {
            setLastResponse(prev => (prev || '') + delta);
            pendingTextRef.current += delta;
          }
          break;
        }
        case 'response.delta': {
          // Generic catcher for proxy formats
          const d: any = message.delta;
          let deltaText = '';
          if (typeof d === 'string') {
            deltaText = d;
          } else if (d) {
            if (typeof d.text === 'string') deltaText += d.text;
            if (typeof d.output_text === 'string') deltaText += d.output_text;
            if (Array.isArray(d.content)) {
              deltaText += d.content.map((c: any) => c?.text || c?.output_text || '').join('');
            }
          }
          if (deltaText) {
            setLastResponse(prev => (prev || '') + deltaText);
            pendingTextRef.current += deltaText;
          }
          break;
        }

        case 'response.text.done':
        case 'response.output_text.done': {
          const finalText = message.text || message.output_text || lastResponse || '';
          setLastResponse(finalText);
          if (finalText && finalText.length > (lastResponse || '').length) {
            pendingTextRef.current += finalText.slice((lastResponse || '').length);
          }
          // Do not mark finished here; wait for playback drain
          break;
        }

        case 'response.audio_transcript.delta': {
          const delta = message.delta || message.transcript_delta || '';
          if (delta) {
            setLastResponse(prev => (prev || '') + delta);
            pendingTextRef.current += delta;
          }
          break;
        }

        case 'response.audio_transcript.done': {
          const finalText = message.transcript || message.text || '';
          if (finalText) {
            setLastResponse(prev => finalText.length > (prev || '').length ? finalText : prev);
            if (finalText.length > (lastResponse || '').length) {
              pendingTextRef.current += finalText.slice((lastResponse || '').length);
            }
          }
          break;
        }

        case 'response.function_call_arguments.delta':
          // Handle function call for RAG context
          break;

        case 'response.function_call_arguments.done':
          if (message.name === 'get_user_context') {
            handleContextRequest(message.arguments, message.call_id);
          }
          break;

        case 'error':
          const errorDetails = message.error || message;
          
          // Check if error is empty/benign FIRST
          const isEmptyError = !errorDetails || 
                              Object.keys(errorDetails).length === 0 ||
                              (errorDetails.error && Object.keys(errorDetails.error).length === 0);
          
          if (isEmptyError) {
            console.warn('[Realtime] Empty error suppressed');
            hasActiveResponseRef.current = false;
            break;
          }
          
          const errorMessage = errorDetails?.message || 
                              errorDetails?.code || 
                              (Object.keys(errorDetails || {}).length > 0 ? JSON.stringify(errorDetails) : null) || 
                              'Unknown API error';
          
          // Treat cancellation-without-active-response as benign
          const lower = String(errorMessage || '').toLowerCase();
          const isBenignCancel = lower.includes('cancellation failed') || 
                                lower.includes('no active response') ||
                                lower.includes('buffer too small') ||
                                lower === 'unknown api error' ||
                                !errorDetails || 
                                Object.keys(errorDetails || {}).length === 0;
          
          if (isBenignCancel) {
            console.warn('[Realtime] Benign error suppressed:', errorMessage);
            hasActiveResponseRef.current = false;
            break;
          }
          
          // Only log and show real errors - but don't show empty error details
          if (errorDetails && Object.keys(errorDetails).length > 0) {
            console.error('Realtime API error details:', errorDetails);
            setError(`OpenAI Realtime API error: ${errorMessage}`);
          } else {
            console.warn('Realtime API error (empty details) - suppressing display');
            // Don't set error for empty error details
          }
          break;

        default:
          console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling realtime message:', error);
      // Only show critical processing errors
      if (error instanceof Error && error.message.includes('critical')) {
        setError('Failed to process response');
      }
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
      
      // Convert PCM16 data to AudioBuffer - use 24kHz for output audio
      const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < channelData.length; i++) {
        const sample = (audioData[i * 2] | (audioData[i * 2 + 1] << 8));
        channelData[i] = sample < 32768 ? sample / 32768 : (sample - 65536) / 32768;
      }
      
      audioQueueRef.current.push(audioBuffer);
      
      if (!isPlayingAudioRef.current && !pausedRef.current) {
        playNextAudioChunk();
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      // Don't set error state for individual audio chunk failures
    }
  }, []);

  const maybeMarkPlaybackDrained = useCallback(() => {
    const noQueue = audioQueueRef.current.length === 0;
    const noActiveSource = !currentSourceRef.current;
    const streamComplete = streamCompleteRef.current;
    const isPaused = pausedRef.current;
    
    // console.log('[maybeMarkPlaybackDrained] Checking drain conditions:', { streamComplete, noQueue, noActiveSource, isPaused });

    // Only declare drained when:
    // - stream finished,
    // - no audio queued,
    // - no source currently playing,
    // - we are NOT paused,
    if (streamComplete && noQueue && noActiveSource && !isPaused) {
      playbackDrainedRef.current = true;
      setIsPlaybackDrained(true);
      setIsProcessing(false);
      setIsPlaying(false);
      // console.log('[maybeMarkPlaybackDrained] Marked as drained');
    }
  }, []);

  // Play audio chunks sequentially
  const playNextAudioChunk = useCallback(() => {
    // If paused, do not consume the queue
    if (pausedRef.current || audioContextRef.current?.state === 'suspended') {
      // console.log('[playNextAudioChunk] Skipping - paused or suspended');
      return;
    }

    // If we already have an active source, avoid starting another
    if (currentSourceRef.current) return;

    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      setIsPlaying(false);
      maybeMarkPlaybackDrained();
      return;
    }

    const audioBuffer = audioQueueRef.current.shift();
    if (!audioBuffer || !audioContextRef.current) {
      maybeMarkPlaybackDrained();
      return;
    }

    isPlayingAudioRef.current = true;
    setIsPlaying(true);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    currentSourceRef.current = source;
    
    const startTime = audioContextRef.current.currentTime;
    
    source.onended = () => {
      // console.log('[playNextAudioChunk] Buffer ended');
      // Only process the end if we're not paused
      if (!pausedRef.current) {
        currentSourceRef.current = null;
        maybeMarkPlaybackDrained();
        playNextAudioChunk();
      } else {
        // console.log('[playNextAudioChunk] Ended while paused - not processing');
      }
    };

    // Store buffer reference in case we need to pause
    (source as any).__buffer = audioBuffer;
    (source as any).__startTime = startTime;

    source.start();

    // Start or continue the reveal loop while audio is playing
    if (revealTimerRef.current == null) {
      lastRevealTsRef.current = performance.now();
      revealTimerRef.current = window.setInterval(() => {
        if (!isPlayingAudioRef.current || pausedRef.current || stoppedUntilNextResponseRef.current) {
          lastRevealTsRef.current = performance.now();
          return;
        }
        const now = performance.now();
        const dt = (now - lastRevealTsRef.current) / 1000;
        lastRevealTsRef.current = now;
        const cps = charsPerSecondRef.current;
        if (pendingTextRef.current.length > 0 && cps > 0) {
          const take = Math.max(1, Math.floor(cps * dt));
          const slice = pendingTextRef.current.slice(0, take);
          pendingTextRef.current = pendingTextRef.current.slice(slice.length);
          setVisibleResponse(prev => prev + slice);
        }
        // If playback ended and nothing left to reveal, stop the timer
        if (!isPlayingAudioRef.current && pendingTextRef.current.length === 0) {
          if (revealTimerRef.current) {
            clearInterval(revealTimerRef.current);
            revealTimerRef.current = null;
          }
        }
      }, 50);
    }
  }, [maybeMarkPlaybackDrained]);

  // When streaming is complete and playback is drained, flush any remaining text
  useEffect(() => {
    if (isStreamComplete && isPlaybackDrained) {
      // Reveal everything we have
      if (pendingTextRef.current.length > 0 || visibleResponse !== lastResponse) {
        setVisibleResponse(lastResponse);
        pendingTextRef.current = '';
      }
      if (revealTimerRef.current) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    }
  }, [isStreamComplete, isPlaybackDrained, lastResponse, visibleResponse]);

  // Handle context requests from the model
  const handleContextRequest = useCallback(async (args: any, callId?: string) => {
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
      if (callId && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify(contextData)
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching context:', error);
    }
  }, []);

  // Clear all buffers and reset state
  const clearBuffers = useCallback(() => {
    // Clear audio buffers
    audioQueueRef.current = [];
    if (currentSourceRef.current) {
      try { 
        currentSourceRef.current.stop(); 
      } catch {} 
      currentSourceRef.current = null;
    }
    
    // Clear text buffers
    setLastResponse('');
    setVisibleResponse('');
    pendingTextRef.current = '';
    
    // Reset state
    setIsPausedByUser(false);
    isPausedByUserRef.current = false;
    pausedRef.current = false;
    streamCompleteRef.current = false;
    playbackDrainedRef.current = false;
    setIsStreamComplete(false);
    setIsPlaybackDrained(false);
    isPlayingAudioRef.current = false;
    setIsPlaying(false);
    setIsProcessing(false);
    hasActiveResponseRef.current = false;
    
    // Clear reveal timer
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    
    // Clear error
    setError(null);
  }, []);

  // Start audio input using AudioWorklet with ScriptProcessorNode fallback
  const startListening = useCallback(async () => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setError('Not connected to Voice Coach');
        return;
      }

      // Clear any previous buffers and reset state for new voice interaction
      clearBuffers();

      await initAudioContext();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const ctx = audioContextRef.current!;
      let accumulatedMs = 0;
      let hasAudioFrame = false;
      let useWorklet = false;

      try {
        // Try AudioWorklet first
        if (!(ctx as any).audioWorklet?.modules?.length) {
          await ctx.audioWorklet.addModule('/audio/pcm16-worklet.js');
        }

        const src = ctx.createMediaStreamSource(stream);
        const node = new (window as any).AudioWorkletNode(ctx, 'pcm16-worklet');

        node.port.onmessage = (ev: MessageEvent<Uint8Array>) => {
          const u8 = ev.data; // 20ms @16kHz mono pcm16
          accumulatedMs += 20;
          hasAudioFrame = true;

          console.log(`Audio frame received: ${u8.byteLength} bytes, total ms: ${accumulatedMs}`);

          // Base64 encode without copying repeatedly
          let binary = '';
          const len = u8.byteLength;
          for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
          const base64 = btoa(binary);

          wsRef.current?.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64
          }));
        };

      src.connect(node);
      (processorRef as any).current = { node, src, disconnect: () => { node.disconnect(); src.disconnect(); } };
      useWorklet = true;
      console.log('Using AudioWorklet for audio processing - MANUAL PUSH-TO-TALK MODE');
        
      } catch (workletError) {
        console.warn('AudioWorklet failed, falling back to ScriptProcessorNode:', workletError);
        
        // Fallback to ScriptProcessorNode
        const src = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
          }

          const inputData = e.inputBuffer.getChannelData(0);
          accumulatedMs += (inputData.length / 16000) * 1000; // Convert samples to ms
          hasAudioFrame = true;

          console.log(`ScriptProcessor frame: ${inputData.length} samples, total ms: ${accumulatedMs}`);
          
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

        src.connect(processor);
        processor.connect(ctx.destination);
        (processorRef as any).current = { processor, src, disconnect: () => { processor.disconnect(); src.disconnect(); } };
        useWorklet = false;
        console.log('Using ScriptProcessorNode for audio processing - MANUAL PUSH-TO-TALK MODE');
      }

      // Keep refs so we can stop later
      (mediaRecorderRef as any).current = stream;
      setIsListening(true);
      
      // Store ms and frame status so stopListening can check them
      (listeningMsRef as any).current = () => accumulatedMs;
      (hasAudioFrameRef as any).current = () => hasAudioFrame;
      
    } catch (error) {
      console.error('Error starting audio input:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [initAudioContext, clearBuffers]);

  // Stop audio input with proper buffer commit logic
  const stopListening = useCallback(() => {
    try {
      // Stop nodes & tracks
      const processor = (processorRef as any).current;
      if (processor && typeof processor.disconnect === 'function') {
        processor.disconnect();
        (processorRef as any).current = null;
      }
      
      const stream: MediaStream | undefined = (mediaRecorderRef as any).current;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        (mediaRecorderRef as any).current = null;
      }

      // Ensure ≥100ms before commit
      const gotMs = (listeningMsRef as any).current ? (listeningMsRef as any).current() : 0;
      const hasFrame = (hasAudioFrameRef as any).current ? (hasAudioFrameRef as any).current() : false;
      
      console.log(`Stopping listening: gotMs=${gotMs}, hasFrame=${hasFrame}`);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // More lenient threshold - allow any audio > 0ms
        if (gotMs > 0) {
          console.log('Committing audio buffer...');
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          
          // Check if there's already an active response before creating a new one
          if (!hasActiveResponseRef.current) {
            console.log('Creating new response...');
            wsRef.current.send(JSON.stringify({
              type: 'response.create',
              response: { modalities: ['audio', 'text'] }
            }));
          } else {
            console.log('Skipping response.create - already have active response');
          }
        } else {
          // we didn't get any audio — don't commit empty buffer
          console.warn('Skip commit: no audio recorded (0ms)');
          // Don't show error for empty audio - this is normal user behavior
        }
      }
    } finally {
      setIsListening(false);
    }
  }, []);

  // Send text input
  const sendText = useCallback((text: string) => {
    console.log('[useOpenAIRealtime] sendText called:', text.substring(0, 50) + '...');
    console.log('[useOpenAIRealtime] WebSocket state:', wsRef.current?.readyState, 'hasActiveResponse:', hasActiveResponseRef.current);
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send text');
      setError('Not connected to Voice Coach');
      return;
    }

    // Check if there's already an active response - but be more lenient for first message
    if (hasActiveResponseRef.current) {
      console.log('Skipping text send - already have active response, but clearing it first');
      // Clear the active response flag to allow new messages
      hasActiveResponseRef.current = false;
      setIsProcessing(false);
      setIsPlaying(false);
    }

    try {
      // Clear all buffers and reset state for new conversation
      clearBuffers();
      
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

      // Check if there's already an active response before creating a new one
      if (!hasActiveResponseRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'response.create'
        }));
      } else {
        console.log('Skipping response.create in sendText - already have active response');
      }

      setCurrentTranscript(text);
      setIsProcessing(true);
    } catch (error) {
      console.error('Error sending text:', error);
      setError('Failed to send message');
    }
  }, [clearBuffers]);

  // Barge-in (interrupt current playback)
  const bargeIn = useCallback(() => {
    try {
      // Stop current audio playback
      audioQueueRef.current = [];
      isPlayingAudioRef.current = false;
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch {}
        currentSourceRef.current = null;
      }
      setIsPlaying(false);
      setIsPausedByUser(false); // Reset pause state when stopping
      isPausedByUserRef.current = false;
      pausedRef.current = false;
      // Stop reveal loop and clear text buffer
      if (revealTimerRef.current) {
        clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      pendingTextRef.current = '';
      setVisibleResponse(prev => prev); // no-op to keep last shown

      // Cancel current response
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        stoppedUntilNextResponseRef.current = true;
        lastCancelAtRef.current = Date.now();
        // Only send cancel if we believe a response is active
        if (hasActiveResponseRef.current) {
          try {
            wsRef.current.send(JSON.stringify({ type: 'response.cancel' }));
          } catch (sendErr) {
            console.error('[bargeIn] response.cancel send failed:', sendErr);
          }
        }
        // Regardless, mark no active response to avoid repeated cancels
        hasActiveResponseRef.current = false;
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Error during barge-in:', error);
      setIsProcessing(false);
      setIsPlaying(false);
    }
  }, []);

  const pauseOutput = useCallback(() => {
    // console.log('[pauseOutput] Starting pause');
    if (audioContextRef.current?.state === 'running') {
      pausedRef.current = true;
      audioContextRef.current.suspend();
      setIsPlaying(false);
      setIsPausedByUser(true);
      isPausedByUserRef.current = true;
      // console.log('[pauseOutput] Pause complete');
    }
  }, []);

  const resumeOutput = useCallback(() => {
    // console.log('[resumeOutput] Starting resume');
    if (audioContextRef.current?.state === 'suspended') {
      pausedRef.current = false;
      isPausedByUserRef.current = false;
      setIsPausedByUser(false);
      
      audioContextRef.current.resume().then(() => {
        // console.log('[resumeOutput] Context resumed, checking for audio to play');
        // Only start consuming the queue if nothing is currently playing
        if (!currentSourceRef.current && audioQueueRef.current.length > 0) {
          playNextAudioChunk();
        }
      });
    }
  }, [playNextAudioChunk]);

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
    setIsStreamComplete(false);
    setIsPlaybackDrained(false);
    setCurrentTranscript('');
    setLastResponse('');
    setVisibleResponse('');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Send custom session update
  const sendSessionUpdate = useCallback((sessionConfig: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'session.update',
        session: sessionConfig
      }));
      return true;
    }
    return false;
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
    isStreamComplete,
    isPlaybackDrained,
    currentTranscript,
    lastResponse,
    visibleResponse,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
    bargeIn,
    clearError,
    pauseOutput,
    resumeOutput,
    clearBuffers,
    sendSessionUpdate
  };
};