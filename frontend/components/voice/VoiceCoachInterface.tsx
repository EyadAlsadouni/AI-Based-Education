'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useOpenAIRealtime } from '../../lib/useOpenAIRealtime';
import { AvatarLoop, AvatarLoopRef } from './AvatarLoop';
import { VoicePreferences, VoicePreferences as VoicePreferencesType } from './VoicePreferences';
import { voiceApi } from '../../lib/api';
import { VoiceCard, VoiceProfile } from '../../types';

interface VoiceCoachInterfaceProps {
  userId: number;
}

export const VoiceCoachInterface: React.FC<VoiceCoachInterfaceProps> = ({ userId }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [cards, setCards] = useState<VoiceCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<VoiceCard | null>(null);
  const [mode, setMode] = useState<'listen' | 'chat'>('chat');
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [voicePreferences, setVoicePreferences] = useState<VoicePreferencesType>({
    voice: 'alloy',
    speed: 1.0,
    playbackSpeed: 1.0
  });
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingCard, setIsPlayingCard] = useState(false);
  const [isPausedCard, setIsPausedCard] = useState(false);

  const realtimeSession = useOpenAIRealtime();
  const avatarRef = useRef<AvatarLoopRef>(null);

  useEffect(() => {
    initializeVoiceCoach();
  }, [userId]);

  const initializeVoiceCoach = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      console.log('Initializing Voice Coach for user:', userId);

      // Step 1: Create voice session
      console.log('Creating voice session...');
      const sessionResponse = await voiceApi.createSession(userId);
      console.log('Session created:', sessionResponse);
      setSessionId(sessionResponse.session_id);

      // Step 2: Get profile and cards
      console.log('Fetching profile and cards...');
      const [profileResponse, cardsResponse] = await Promise.all([
        voiceApi.getProfile(userId),
        voiceApi.getCards(userId)
      ]);
      console.log('Profile and cards fetched successfully');

      setProfile(profileResponse.profile);
      setCards(cardsResponse.cards);

      // Step 3: Connect to OpenAI Realtime API
      console.log('Connecting to OpenAI Realtime API...');
      await realtimeSession.connect(userId, sessionResponse.session_id);
      console.log('Connected to OpenAI Realtime API');
      
      // Step 4: Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasAudioPermission(true);
        console.log('Microphone permission granted');
      } catch (error) {
        console.warn('Microphone permission denied:', error);
        setHasAudioPermission(false);
      }

    } catch (error) {
      console.error('Error initializing Voice Coach:', error);
      setError(`Failed to initialize Voice Coach: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCardSelect = async (card: VoiceCard) => {
    try {
      // If clicking on the currently selected card that's playing or paused
      if (selectedCard?.id === card.id && currentAudio) {
        if (isPausedCard) {
          // Resume playback
          currentAudio.play();
          avatarRef.current?.play();
          setIsPausedCard(false);
          setIsPlayingCard(true);
        } else if (isPlayingCard) {
          // Pause playback
          currentAudio.pause();
          avatarRef.current?.pause();
          setIsPausedCard(true);
          setIsPlayingCard(false);
        }
        return;
      }

      // Stop any current audio if playing a different card
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setIsPlayingCard(false);
        setIsPausedCard(false);
        avatarRef.current?.pause();
      }

      setSelectedCard(card);
      setMode('listen');
      setIsPlayingCard(true);
      setIsPausedCard(false);

      // Play card summary using new gpt-4o-mini-tts approach
      const summaryResponse = await voiceApi.summarizeCard(userId, card.id);

      if (summaryResponse.audio_url) {
        // Start avatar animation
        avatarRef.current?.play();
        
        // Play audio (this will be handled by the cached TTS system)
        const audio = new Audio(summaryResponse.audio_url);
        setCurrentAudio(audio);
        
        audio.onended = () => {
          // Stop avatar animation when audio ends
          setTimeout(() => {
            avatarRef.current?.pause();
            setIsPlayingCard(false);
            setIsPausedCard(false);
            setCurrentAudio(null);
            setSelectedCard(null);
          }, 120); // ≤120ms delay requirement
        };
        
        audio.onerror = () => {
          setIsPlayingCard(false);
          setIsPausedCard(false);
          setCurrentAudio(null);
          avatarRef.current?.pause();
        };
        
        await audio.play();
      }

    } catch (error) {
      console.error('Error playing card summary:', error);
      setError('Failed to play card summary');
      setIsPlayingCard(false);
      setIsPausedCard(false);
      setCurrentAudio(null);
    }
  };

  const handleStopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingCard(false);
      setIsPausedCard(false);
      setCurrentAudio(null);
      setSelectedCard(null);
      avatarRef.current?.pause();
    }
  };

  const handleMicToggle = () => {
    if (realtimeSession.isListening) {
      realtimeSession.stopListening();
    } else {
      realtimeSession.startListening();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      realtimeSession.sendText(textInput.trim());
      setTextInput('');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasAudioPermission(true);
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setError('Microphone permission is required for voice features');
    }
  };

  // Handle barge-in when user speaks during playback
  useEffect(() => {
    if (realtimeSession.isListening && realtimeSession.isPlaying) {
      realtimeSession.bargeIn();
      avatarRef.current?.pause();
    }
  }, [realtimeSession.isListening, realtimeSession.isPlaying]);

  // Sync avatar with audio playback
  useEffect(() => {
    if (realtimeSession.isPlaying) {
      avatarRef.current?.play();
    } else {
      // ≤120ms delay requirement for stopping animation
      setTimeout(() => {
        avatarRef.current?.pause();
      }, 120);
    }
  }, [realtimeSession.isPlaying]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing Voice Coach</h2>
          <p className="text-gray-600">Setting up your personalized health assistant...</p>
        </div>
      </div>
    );
  }

  if (error || realtimeSession.error) {
    const errorMessage = error || realtimeSession.error;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-fit">
            <VolumeX className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Voice Coach Error</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mr-2"
          >
            Try Again
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Voice Coach</h1>
              {profile && (
                <p className="text-gray-600">
                  Welcome back, {profile.full_name} • {profile.condition_selected}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  realtimeSession.isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600">
                  {realtimeSession.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            
              {/* Voice Preferences */}
              <div className="relative">
                <VoicePreferences 
                  onPreferencesChange={setVoicePreferences}
                  className=""
                />
              </div>

              {/* Back to Dashboard Button */}
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="cursor-pointer hover:bg-gray-50 hover:border-gray-400"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Main Content - Voice Agent and Mode Selection Side by Side */}
        <div className="flex gap-6 justify-center mb-8">
          {/* Voice Agent Section */}
          <div className="bg-white rounded-xl shadow-lg p-12 max-w-2xl w-full">
            <div className="text-center">
              {/* Larger Square Avatar */}
              <div className="w-96 h-96 mx-auto mb-8 relative">
                <AvatarLoop
                  ref={avatarRef}
                  className="w-full h-full"
                  isPlaying={realtimeSession.isPlaying || isPlayingCard}
                  onError={(error) => setError(error)}
                />
                {/* Stop button overlay when audio is playing or paused */}
                {(isPlayingCard || isPausedCard) && (
                  <button
                    onClick={handleStopAudio}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
                    title="Stop Audio"
                  >
                    <VolumeX className="h-5 w-5" />
                  </button>
                )}
              </div>

              {profile && (
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">{profile.full_name}</h3>
                  <p className="text-lg text-gray-600">{profile.condition_selected}</p>
                </div>
              )}

              {/* Microphone Controls */}
              <div className="flex justify-center mb-6">
                <Button
                  onClick={handleMicToggle}
                  disabled={!hasAudioPermission || !realtimeSession.isConnected}
                  variant={realtimeSession.isListening ? 'primary' : 'secondary'}
                  size="lg"
                  className="rounded-full p-6 cursor-pointer hover:scale-105 transition-transform"
                >
                  {realtimeSession.isListening ? (
                    <Mic className="h-8 w-8" />
                  ) : (
                    <MicOff className="h-8 w-8" />
                  )}
                </Button>
              </div>

              {/* Status Text */}
              <div className="text-center mb-6">
                {!hasAudioPermission && (
                  <div className="text-amber-600 text-sm mb-2">
                    <Button
                      onClick={requestMicrophonePermission}
                      variant="secondary"
                      size="sm"
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      Enable Microphone
                    </Button>
                  </div>
                )}

                <p className="text-lg text-gray-600">
                  {realtimeSession.isListening && 'Listening...'}
                  {realtimeSession.isProcessing && 'Processing...'}
                  {realtimeSession.isPlaying && 'Speaking...'}
                  {isPlayingCard && 'Playing card summary...'}
                  {isPausedCard && 'Paused'}
                  {!realtimeSession.isListening && !realtimeSession.isProcessing && !realtimeSession.isPlaying && !isPlayingCard && !isPausedCard &&
                    'Ready to chat'}
                </p>
              </div>

              {/* Toggle Chat Button */}
              <Button
                onClick={() => setShowChatInterface(!showChatInterface)}
                variant="outline"
                className="cursor-pointer hover:bg-gray-50 flex items-center gap-2 mx-auto"
              >
                <MessageCircle className="h-5 w-5" />
                {showChatInterface ? 'Hide Chat' : 'Show Chat Interface'}
              </Button>
            </div>
          </div>

          {/* Mode Selection Section - Vertical Layout */}
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Mode Selection</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setMode('listen')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer hover:bg-gray-100 ${
                    mode === 'listen'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-gray-50 text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Listen Mode
                </button>
                <button
                  onClick={() => setMode('chat')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer hover:bg-gray-100 ${
                    mode === 'chat'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-gray-50 text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Chat Mode
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              {/* Cards Section for Listen Mode */}
              {mode === 'listen' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Select a card to listen to educational content:</p>
                  <div className="flex flex-col gap-3">
                    {cards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleCardSelect(card)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-md ${
                          selectedCard?.id === card.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <h4 className="font-medium text-gray-800 text-sm">{card.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          ~{Math.round(card.duration_estimate / 1000)}s
                          {selectedCard?.id === card.id && (
                            <span className="ml-2 font-semibold">
                              {isPlayingCard && (
                                <span className="text-blue-600">Playing...</span>
                              )}
                              {isPausedCard && (
                                <span className="text-amber-600">Paused</span>
                              )}
                            </span>
                          )}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Mode Information */}
              {mode === 'chat' && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 mb-4">
                    Use the microphone button to start a conversation with your Voice Coach.
                  </p>
                  <p className="text-xs text-gray-500">
                    You can also use the chat interface for text-based questions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface - Collapsible */}
        {showChatInterface && (
          <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-xl border z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Chat with Voice Coach
              </h3>
              <button
                onClick={() => setShowChatInterface(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-64 overflow-y-auto bg-gray-50 p-4">
              <div className="space-y-3">
                {realtimeSession.currentTranscript && (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg px-3 py-2 max-w-[80%] text-sm">
                      {realtimeSession.currentTranscript}
                    </div>
                  </div>
                )}

                {realtimeSession.lastResponse && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg px-3 py-2 max-w-[80%] shadow-sm border text-sm">
                      {realtimeSession.lastResponse}
                    </div>
                  </div>
                )}

                {realtimeSession.isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleTextSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={realtimeSession.isProcessing}
                />
                <Button
                  type="submit"
                  disabled={!textInput.trim() || realtimeSession.isProcessing}
                  size="sm"
                  className="cursor-pointer hover:bg-blue-700"
                >
                  Send
                </Button>
              </div>
            </form>
          </div>
        )}



        {/* Live Transcript Display */}
        {realtimeSession.currentTranscript && (
          <div className="mt-6 bg-black/80 text-white rounded-lg p-4 text-center">
            <p className="text-lg">{realtimeSession.currentTranscript}</p>
          </div>
        )}
      </div>
    </div>
  );
};