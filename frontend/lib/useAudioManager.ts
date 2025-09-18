'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Lightweight event emitter for browser
class SimpleEmitter {
  private listeners: Record<string, Set<(...args: any[]) => void>> = {};

  on(event: string, handler: (...args: any[]) => void) {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(handler);
  }

  off(event: string, handler: (...args: any[]) => void) {
    this.listeners[event]?.delete(handler);
  }

  emit(event: string, ...args: any[]) {
    this.listeners[event]?.forEach((h) => {
      try { h(...args); } catch (_) {}
    });
  }
}

// AudioManager singleton
class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private eventEmitter = new SimpleEmitter();
  private isPlaying = false;
  private isPaused = false;
  private currentUrl: string | null = null;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private ensureAudioElement() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      this.audioElement.onplay = () => this.eventEmitter.emit('start');
      this.audioElement.onpause = () => {
        if (this.isPlaying) {
          // User-initiated pause or programmatic pause
          this.eventEmitter.emit('pause');
        }
      };
      this.audioElement.onended = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.eventEmitter.emit('end');
      };
      this.audioElement.onerror = (err) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.eventEmitter.emit('error', err);
      };
    }
  }

  public async play(url: string) {
    this.ensureAudioElement();
    // If playing something else, stop first
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isPlaying = true;
    this.isPaused = false;
    this.currentUrl = url;
    this.audioElement!.src = url;
    try {
      await this.audioElement!.play();
      // 'start' event fires via onplay
    } catch (err) {
      this.isPlaying = false;
      this.isPaused = false;
      this.eventEmitter.emit('error', err);
    }
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
      this.isPaused = false;
      this.eventEmitter.emit('end');
    }
  }

  public pause() {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.isPaused = true;
      this.isPlaying = false;
      // Emit 'pause' only; not 'end'
      this.eventEmitter.emit('pause');
    }
  }

  public resume() {
    if (this.audioElement && this.isPaused) {
      this.isPaused = false;
      this.isPlaying = true;
      this.audioElement.play().catch((err) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.eventEmitter.emit('error', err);
      });
      // 'start' will emit via onplay
    }
  }

  public on(event: 'start' | 'pause' | 'end' | 'error', handler: (...args: any[]) => void) {
    this.eventEmitter.on(event, handler);
  }

  public off(event: 'start' | 'pause' | 'end' | 'error', handler: (...args: any[]) => void) {
    this.eventEmitter.off(event, handler);
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public getIsPaused() {
    return this.isPaused;
  }

  public getCurrentUrl() {
    return this.currentUrl;
  }
}

export default AudioManager;

export const useAudioManager = (): AudioManagerHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Check for microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      // Stop the stream since we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setError('Microphone permission is required for voice input');
      setHasPermission(false);
      return false;
    }
  }, []);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      
      // Create MediaRecorder with appropriate format
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      };
      
      // Fallback for browsers that don't support webm/opus
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          
          // Convert to base64 and send immediately for streaming
          const reader = new FileReader();
          reader.onload = () => {
            const audioData = (reader.result as string).split(',')[1]; // Remove data:audio/webm;base64, prefix
            // This would be sent to the WebSocket for real-time processing
            // onAudioChunk?.(audioData);
          };
          reader.readAsDataURL(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: options.mimeType });
        // Final audio processing could be done here
      };
      
      mediaRecorderRef.current.start(100); // Collect data every 100ms for streaming
      setIsRecording(true);
      setError(null);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  }, [hasPermission, requestPermission]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isRecording]);

  // Play audio from base64 data
  const playAudio = useCallback(async (audioData: string) => {
    try {
      initAudioContext();
      
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      // Create audio element from base64 data
      const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
      audio.volume = volume;
      
      currentAudioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        currentAudioRef.current = null;
      };
      audio.onerror = (err) => {
        console.error('Audio playback error:', err);
        setError('Failed to play audio response');
        setIsPlaying(false);
        currentAudioRef.current = null;
      };
      
      await audio.play();
      
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio response');
      setIsPlaying(false);
    }
  }, [volume, initAudioContext]);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = clampedVolume;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check permission on mount
  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then(result => {
        setHasPermission(result.state === 'granted');
        
        result.addEventListener('change', () => {
          setHasPermission(result.state === 'granted');
        });
      })
      .catch(() => {
        // Fallback: assume no permission initially
        setHasPermission(false);
      });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      stopAudio();
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopRecording, stopAudio]);

  return {
    isRecording,
    isPlaying,
    volume,
    error,
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,
    setVolume,
    clearError,
    hasPermission,
    requestPermission
  };
};