'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface AudioManagerHook {
  isRecording: boolean;
  isPlaying: boolean;
  volume: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playAudio: (audioData: string) => Promise<void>;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
  clearError: () => void;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

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