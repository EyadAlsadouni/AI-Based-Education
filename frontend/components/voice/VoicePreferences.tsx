'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface VoicePreferencesProps {
  onPreferencesChange?: (preferences: VoicePreferences) => void;
  className?: string;
}

export interface VoicePreferences {
  voice: string;
  speed: number;
  playbackSpeed: number;
}

const AVAILABLE_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced tone' },
  { id: 'echo', name: 'Echo', description: 'Calm, soothing voice' },
  { id: 'fable', name: 'Fable', description: 'Warm, friendly tone' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, confident voice' },
  { id: 'nova', name: 'Nova', description: 'Bright, energetic tone' },
  { id: 'shimmer', name: 'Shimmer', description: 'Gentle, caring voice' }
];

const SPEED_OPTIONS = [
  { value: 0.75, label: '0.75x (Slower)' },
  { value: 1.0, label: '1.0x (Normal)' },
  { value: 1.25, label: '1.25x (Faster)' }
];

export const VoicePreferences: React.FC<VoicePreferencesProps> = ({ 
  onPreferencesChange, 
  className = '' 
}) => {
  const [preferences, setPreferences] = useState<VoicePreferences>({
    voice: 'alloy',
    speed: 1.0,
    playbackSpeed: 1.0
  });

  const [isOpen, setIsOpen] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('voice-coach-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
        onPreferencesChange?.(parsed);
      } catch (error) {
        console.error('Error loading voice preferences:', error);
      }
    }
  }, [onPreferencesChange]);

  const updatePreferences = (updates: Partial<VoicePreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    localStorage.setItem('voice-coach-preferences', JSON.stringify(newPreferences));
    onPreferencesChange?.(newPreferences);
  };

  const playVoicePreview = async (voiceId: string) => {
    try {
      setPreviewPlaying(voiceId);
      
      // Create a short preview using OpenAI TTS
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: voiceId,
          text: `Hello! I'm ${AVAILABLE_VOICES.find(v => v.id === voiceId)?.name}. This is how I sound as your health coach.`,
          speed: preferences.speed
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setPreviewPlaying(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing voice preview:', error);
      setPreviewPlaying(null);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        className={`${className} text-xs`}
      >
        Voice Settings
      </Button>
    );
  }

  return (
    <div className={`${className} bg-white rounded-lg border shadow-lg p-4 absolute right-0 top-full mt-2 z-50 w-80`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Voice Preferences</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Voice Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Voice Character
        </label>
        <div className="space-y-2">
          {AVAILABLE_VOICES.map((voice) => (
            <div key={voice.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`voice-${voice.id}`}
                    name="voice"
                    value={voice.id}
                    checked={preferences.voice === voice.id}
                    onChange={(e) => updatePreferences({ voice: e.target.value })}
                    className="text-blue-600"
                  />
                  <label htmlFor={`voice-${voice.id}`} className="cursor-pointer">
                    <div className="font-medium text-gray-800">{voice.name}</div>
                    <div className="text-xs text-gray-600">{voice.description}</div>
                  </label>
                </div>
              </div>
              <Button
                onClick={() => playVoicePreview(voice.id)}
                disabled={previewPlaying === voice.id}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                {previewPlaying === voice.id ? '...' : '▶️'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Speech Speed */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Speech Speed
        </label>
        <select
          value={preferences.speed}
          onChange={(e) => updatePreferences({ speed: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-300 transition-colors"
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Playback Speed */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Playback Speed
        </label>
        <select
          value={preferences.playbackSpeed}
          onChange={(e) => updatePreferences({ playbackSpeed: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-300 transition-colors"
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        💡 Speech speed affects how fast the AI speaks. Playback speed affects all audio playback.
      </div>
    </div>
  );
};