'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useOpenAIRealtime } from '../../lib/useOpenAIRealtime';
import { AvatarLoop, AvatarLoopRef } from './AvatarLoop';
import { VoicePreferences, VoicePreferences as VoicePreferencesType } from './VoicePreferences';
import { voiceApi } from '../../lib/api';
import { VoiceCard, VoiceProfile } from '../../types';
import AudioManager from '../../lib/useAudioManager';

interface VoiceCoachInterfaceProps {
  userId: number;
}

type ChatMsg =
  | { id: string; role: 'user'; text: string; createdAt: number }
  | {
      id: string;
      role: 'assistant';
      text?: string;
      audioUrl?: string;
      status: 'processing' | 'playing' | 'paused' | 'finished' | 'stopped' | 'interrupted' | 'error';
      createdAt: number;
    };

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
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const activeAssistantIdRef = useRef<string | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ active: boolean; offsetX: number; offsetY: number }>({ active: false, offsetX: 0, offsetY: 0 });

  const realtimeSession = useOpenAIRealtime();
  const avatarRef = useRef<AvatarLoopRef>(null);
  const audioManager = AudioManager.getInstance();
  const activeUserIdRef = useRef<string | null>(null);

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

  // Playback event logging and avatar sync
  useEffect(() => {
    const handleStart = () => {
      setIsPlayingCard(true);
      setIsPausedCard(false);
      avatarRef.current?.play();
      console.log('[AudioManager] start');
    };
    const handleEnd = () => {
      setIsPlayingCard(false);
      setIsPausedCard(false);
      avatarRef.current?.pause();
      setSelectedCard(null);
      console.log('[AudioManager] end');
    };
    const handleError = (err: any) => {
      setIsPlayingCard(false);
      setIsPausedCard(false);
      avatarRef.current?.pause();
      setError('Failed to play audio');
      setSelectedCard(null);
      console.log('[AudioManager] error', err);
    };
    audioManager.on('start', handleStart);
    audioManager.on('end', handleEnd);
    audioManager.on('error', handleError);
    return () => {
      audioManager.off('start', handleStart);
      audioManager.off('end', handleEnd);
      audioManager.off('error', handleError);
    };
  }, [audioManager]);

  // Auto-scroll chat to newest message when near bottom
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Reflect realtime playback state into current assistant message status
  useEffect(() => {
    const id = activeAssistantIdRef.current;
    if (!id) return;
    setMessages(prev => prev.map(m => {
      if (m.role !== 'assistant' || m.id !== id) return m;

      // Preserve paused even if streaming/processing continues
      if ((m as any).status === 'paused') return m;

      if (realtimeSession.isPlaying) return { ...m, status: 'playing' } as any;
      if (realtimeSession.isProcessing) return { ...m, status: 'processing' } as any;

      // Finish only when both streaming complete AND playback drained
      if (realtimeSession.isStreamComplete && realtimeSession.isPlaybackDrained) {
        return { ...m, status: 'finished' } as any;
      }
      return m as any;
    }));
  }, [
    realtimeSession.isProcessing,
    realtimeSession.isPlaying,
    realtimeSession.isStreamComplete,
    realtimeSession.isPlaybackDrained
  ]);

  // Update assistant text as it streams (chat mode only)
  useEffect(() => {
    const id = activeAssistantIdRef.current;
    if (!id) return;
    setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === id ? { ...m, text: realtimeSession.visibleResponse } : m)));
  }, [realtimeSession.visibleResponse]);

  // Robust pause/resume logic for card playback
  const handleCardSelect = async (card: VoiceCard) => {
    try {
      // If clicking the currently selected card
      if (selectedCard?.id === card.id) {
        if (audioManager.getIsPlaying()) {
          // Pause if currently playing
          audioManager.pause();
          setIsPausedCard(true);
          setIsPlayingCard(false);
          avatarRef.current?.pause();
          return;
        } else if (isPausedCard) {
          // Resume if currently paused
          audioManager.resume();
          setIsPausedCard(false);
          setIsPlayingCard(true);
          avatarRef.current?.play();
          return;
        } else {
          // If not playing or paused, do nothing (should not happen)
          return;
        }
      }
      // If a different card, stop current audio and play new
      audioManager.stop();
      setIsPlayingCard(false);
      setIsPausedCard(false);
      avatarRef.current?.pause();
      setSelectedCard(card);
      setMode('listen');
      // Play card summary using new gpt-4o-mini-tts approach
      const summaryResponse = await voiceApi.summarizeCard(userId, card.id);
      if (summaryResponse.audio_url) {
        // Wait for audioManager.play to resolve, then avatar will start via event
        await audioManager.play(summaryResponse.audio_url);
        setIsPlayingCard(true);
        setIsPausedCard(false);
      }
    } catch (error) {
      console.error('Error playing card summary:', error);
      setError('Failed to play card summary');
      setIsPlayingCard(false);
      setIsPausedCard(false);
      setSelectedCard(null);
      avatarRef.current?.pause();
    }
  };

  const handleStopAudio = () => {
    audioManager.stop();
    setIsPlayingCard(false);
    setIsPausedCard(false);
    setSelectedCard(null);
    avatarRef.current?.pause();
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
    const text = textInput.trim();
    if (!text) return;

    // Single-turn policy: interrupt any active assistant turn
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && ['processing', 'playing', 'paused'].includes((m as any).status));
    if (lastAssistant) {
      realtimeSession.bargeIn();
      audioManager.stop();
      setMessages(prev => prev.map(m => (m.id === lastAssistant.id ? { ...(m as any), status: 'interrupted' } : m)));
      activeAssistantIdRef.current = null;
    }

    // Clear any previous response text to avoid mixing
    realtimeSession.clearError();
    
    // Append user message
    const userMsg: ChatMsg = { id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`, role: 'user', text, createdAt: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    activeUserIdRef.current = userMsg.id;

    // Create assistant placeholder
    const asstId = `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    activeAssistantIdRef.current = asstId;
    const assistantMsg: ChatMsg = { id: asstId, role: 'assistant', status: 'processing', createdAt: Date.now() } as ChatMsg;
    setMessages(prev => [...prev, assistantMsg]);

    // Send to realtime
    realtimeSession.sendText(text);
    setTextInput('');
  };

  // Toggle pause/resume by clicking the active user question bubble
  const toggleActiveQuestion = (userMessageId: string) => {
    if (activeUserIdRef.current !== userMessageId) return;
    const asstId = activeAssistantIdRef.current;
    if (!asstId) return;
    setMessages(prev => prev.map(m => {
      if (m.role === 'assistant' && m.id === asstId) {
        if ((m as any).status === 'paused') {
          console.log('[UI] Question clicked - resume');
          realtimeSession.resumeOutput();
          avatarRef.current?.play();
          return { ...(m as any), status: 'playing' } as any;
        }
        // Treat processing/playing as pausable playback
        if (['playing', 'processing'].includes((m as any).status as any)) {
          console.log('[UI] Question clicked - pause');
          realtimeSession.pauseOutput();
          avatarRef.current?.pause();
          return { ...(m as any), status: 'paused' } as any;
        }
      }
      return m as any;
    }));
  };

  // Stop active chat answer via red overlay button
  const stopActiveChat = () => {
    const asstId = activeAssistantIdRef.current;
    if (!asstId) return;
    console.log('[UI] STOP clicked - stopping active chat answer');
    realtimeSession.bargeIn();
    setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === asstId ? { ...(m as any), status: 'stopped' } as any : m as any)));
    activeAssistantIdRef.current = null;
    avatarRef.current?.pause();
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

  // Draggable + resizable chatbox (persist within session)
  useEffect(() => {
    const savedPos = sessionStorage.getItem('chatbox_pos');
    const savedSize = sessionStorage.getItem('chatbox_size');
    const box = chatWindowRef.current;
    if (!box) return;
    if (savedPos) {
      const { x, y } = JSON.parse(savedPos);
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
    }
    if (savedSize) {
      const { w, h } = JSON.parse(savedSize);
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
    }
  }, [showChatInterface]);

  const beginDrag = (e: React.MouseEvent) => {
    const box = chatWindowRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    draggingRef.current = { active: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current.active) return;
      const box = chatWindowRef.current;
      if (!box) return;
      const x = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - draggingRef.current.offsetX));
      const y = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - draggingRef.current.offsetY));
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
    };
    const onUp = () => {
      if (!draggingRef.current.active) return;
      draggingRef.current.active = false;
      const box = chatWindowRef.current;
      if (box) {
        const rect = box.getBoundingClientRect();
        sessionStorage.setItem('chatbox_pos', JSON.stringify({ x: rect.left, y: rect.top }));
        sessionStorage.setItem('chatbox_size', JSON.stringify({ w: rect.width, h: rect.height }));
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  

  const retryAssistant = (text: string) => {
    // Retry by re-sending same text
    setTextInput(text);
    // simulate submit
    setTimeout(() => {
      const form = document.querySelector('#vc-chat-form') as HTMLFormElement | null;
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 0);
  };

  

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
                {/* Stop button overlay when audio is playing or paused (cards or chat) */}
                {(() => {
                  const activeAssistantId = activeAssistantIdRef.current;
                  const isChatPaused = !!activeAssistantId && !!messages.find(mm => mm.role === 'assistant' && (mm as any).id === activeAssistantId && (mm as any).status === 'paused');
                  const showStop = isPlayingCard || isPausedCard || realtimeSession.isPlaying || isChatPaused;
                  return showStop;
                })() && (
                  <button
                    onClick={() => {
                      const activeAssistantId = activeAssistantIdRef.current;
                      const isChatPaused = !!activeAssistantId && !!messages.find(mm => mm.role === 'assistant' && (mm as any).id === activeAssistantId && (mm as any).status === 'paused');
                      if (isPlayingCard || isPausedCard) {
                        handleStopAudio();
                      } else if (realtimeSession.isPlaying || isChatPaused) {
                        stopActiveChat();
                      }
                    }}
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
          <div
            ref={chatWindowRef}
            className="fixed bg-white rounded-xl shadow-xl border z-50"
            style={{ bottom: undefined as any, right: undefined as any, width: 420, height: 520, left: 24, top: window.innerHeight - 560, resize: 'both', overflow: 'hidden' }}
          >
            <div className="flex items-center justify-between p-3 border-b cursor-move select-none bg-white/60 backdrop-blur" onMouseDown={beginDrag}>
              <h3 className="text-xl font-semibold text-gray-800">
                Chat with Voice Coach
              </h3>
              <button
                onClick={() => setShowChatInterface(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={chatRef} className="h-[calc(100%-124px)] overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-4">
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id}>
                    {m.role === 'user' ? (
                      <div className="flex justify-end mb-2">
                        <div
                          className={`bg-blue-600 text-white rounded-2xl px-4 py-3 max-w-[80%] text-sm shadow ${activeUserIdRef.current === m.id && activeAssistantIdRef.current ? 'cursor-pointer ring-1 ring-blue-300' : ''}`}
                          onClick={() => toggleActiveQuestion(m.id)}
                          title={activeUserIdRef.current === m.id && activeAssistantIdRef.current ? 'Click to pause/resume' : undefined}
                        >
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Controls removed per request: Pause/Play/Stop */}
                        <div className="flex justify-end mb-2">
                          <div className="flex items-center gap-2 text-base text-gray-700">
                            {(m.status === 'interrupted' || m.status === 'error') && (
                              <button
                                className="px-2 py-1 rounded-full border w-8 h-8 flex items-center justify-center hover:bg-gray-50"
                                title="Retry"
                                onClick={() => retryAssistant(messages.find(mm => mm.role==='user' && mm.createdAt < m.createdAt)?.text || '')}
                              >
                                ↻
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Assistant response with status on left */}
                        <div className="flex justify-start">
                          <div className="flex items-start gap-3">
                            {/* Status on the left */}
                            <div className="text-xs text-gray-500 mt-1 min-w-[80px]">
                              {m.status === 'processing' && 'Processing…'}
                              {m.status === 'playing' && 'Playing…'}
                              {m.status === 'paused' && 'Paused'}
                              {m.status === 'finished' && 'Finished'}
                              {m.status === 'stopped' && 'Stopped'}
                              {m.status === 'interrupted' && 'Interrupted'}
                              {m.status === 'error' && 'Error'}
                            </div>
                            {/* Assistant response bubble (always render to avoid flicker) */}
                            <div className="bg-white rounded-2xl px-4 py-3 max-w-[70%] shadow border text-sm">
                              <div className="whitespace-pre-wrap leading-6 min-h-[1rem] font-semibold">
                                {m.text && m.text.length > 0
                                  ? m.text
                                  : (['processing','playing','paused'].includes(m.status) ? '…' : '')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form id="vc-chat-form" onSubmit={handleTextSubmit} className="p-4 border-t bg-white/70">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={realtimeSession.isProcessing}
                />
                <Button
                  type="submit"
                  disabled={!textInput.trim() || realtimeSession.isProcessing}
                  size="sm"
                  className="cursor-pointer hover:bg-blue-700 rounded-xl px-4"
                >
                  Send
                </Button>
              </div>
              {/* bottom spacing */}
              <div className="mt-2" />
            </form>
          </div>
        )}



        {/* Removed bottom echo bar per requirements */}
      </div>
    </div>
  );
};