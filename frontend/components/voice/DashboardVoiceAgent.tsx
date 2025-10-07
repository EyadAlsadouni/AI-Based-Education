'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Mic, Send, Square, Pause, Play } from 'lucide-react';
import { Rnd } from 'react-rnd';
import { voiceApi } from '../../lib/api';
import { useOpenAIRealtime } from '../../lib/useOpenAIRealtime';
import { AvatarLoop } from './AvatarLoop';
import { BoldTextRenderer } from './BoldTextRenderer';

interface DashboardVoiceAgentProps {
  userId: number;
  dashboardCards?: any[];
  userSession?: any;
}

type ChatMessage = 
  | { id: string; role: 'user'; text: string; createdAt: number; isVoiceInput?: boolean; isTextInput?: boolean }
  | { id: string; role: 'assistant'; text?: string; status: 'processing' | 'playing' | 'paused' | 'finished' | 'stopped' | 'error'; createdAt: number };

export const DashboardVoiceAgent: React.FC<DashboardVoiceAgentProps> = ({
  userId,
  dashboardCards = [],
  userSession
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [hasShownGreeting, setHasShownGreeting] = useState(false);
  
  const realtimeSession = useOpenAIRealtime();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const textRevealCompleteRef = useRef<boolean>(false);
  const lastFullTextRef = useRef<string>('');
  const lastVoiceTranscriptRef = useRef<string>('');
  const [hasCustomImage, setHasCustomImage] = useState<boolean>(true);

  // Build comprehensive context about dashboard
  const dashboardContext = useMemo(() => {
    const context = {
      page: 'Dashboard',
      cards: dashboardCards.map(card => ({
        id: card.id,
        title: card.title,
        description: card.description,
        icon: card.icon
      })),
      features: [
        'Click on cards to view full educational content',
        'Use the play button on each card to hear audio summaries',
        'Download PDF report with all content',
        'Start over to create a new assessment',
        'Access full Voice Coach for interactive learning'
      ],
      buttons: [
        { name: 'Download Report', purpose: 'Downloads a PDF with all educational content' },
        { name: 'Start Over', purpose: 'Clears current data and starts a new health assessment' },
        { name: 'Talk to Voice Coach', purpose: 'Opens full voice assistant interface for interactive learning' },
        { name: 'Play button (on cards)', purpose: 'Reads card content aloud using text-to-speech' }
      ],
      userInfo: {
        name: userSession?.full_name || 'Patient',
        condition: userSession?.condition_selected || 'Health condition',
        mainGoal: userSession?.main_goal || 'Health improvement'
      }
    };
    return context;
  }, [dashboardCards, userSession]);

  // Enhanced topic keywords including dashboard-specific terms
  const topicKeywords = useMemo(() => {
    const keywords: string[] = [];
    
    // Dashboard page terms
    keywords.push('dashboard', 'card', 'cards', 'button', 'buttons', 'play', 'download', 'pdf', 'report', 
                  'page', 'feature', 'features', 'content', 'voice coach', 'start over', 'help', 'how to', 'explain');
    
    // Card titles and descriptions
    dashboardCards.forEach(card => {
      if (card.title) keywords.push(...card.title.toLowerCase().split(' '));
      if (card.description) keywords.push(...card.description.toLowerCase().split(' '));
    });
    
    // User-specific health topics
    if (userSession?.condition_selected) keywords.push(...userSession.condition_selected.toLowerCase().split(' '));
    if (userSession?.main_interests) {
      const interests = Array.isArray(userSession.main_interests) 
        ? userSession.main_interests 
        : userSession.main_interests.split(',');
      keywords.push(...interests.map((i: string) => i.toLowerCase()));
    }
    if (userSession?.main_goal) {
      const goals = Array.isArray(userSession.main_goal) 
        ? userSession.main_goal 
        : userSession.main_goal.split(',');
      keywords.push(...goals.map((g: string) => g.toLowerCase()));
    }
    
    return Array.from(new Set(keywords.filter(Boolean)));
  }, [dashboardCards, userSession]);

  // Initialize voice session with dashboard-specific system instructions
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initSession = async () => {
        try {
          const session = await voiceApi.createSession(userId);
          setSessionId(session.session_id);
          
          // Connect to realtime session - skip default instructions
          await realtimeSession.connect(userId, session.session_id, true);
          
          // Send dashboard-specific session configuration immediately after connection
          setTimeout(() => {
            if (realtimeSession.isConnected) {
              console.log('[Dashboard Agent] Sending dashboard-specific instructions...');
              
              // Create dashboard-specific instructions (simplified - context is auto-injected by backend)
              const dashboardInstructions = `You are ${userSession?.full_name || 'the user'}'s friendly Dashboard Assistant, here to help them navigate their personalized health dashboard.

CONTEXT AWARENESS:
Before every user question, you automatically receive their complete dashboard data including:
- User profile (name, condition, health goals, medications)
- All dashboard cards with titles, descriptions, and content previews
- Available page features and actions

HOW TO RESPOND:
1. Answer questions directly using the context data provided
2. When asked about health goals → Use the "Primary Health Goal" from their profile
3. When asked about card content → Provide a summary from the preview, then suggest clicking the card for full details
4. Be conversational and natural - handle follow-up questions smoothly
5. Use **bold** formatting for card titles and important terms (the UI will render these as bold)
6. If greeted, respond warmly ONCE, then focus on their actual question

RESPONSE STYLE:
- Warm, supportive, and encouraging (like a helpful health coach)
- Conversational and natural (not robotic)
- Clear and simple (easy to understand)
- DO NOT start with greetings unless user specifically greets you (says "hi", "hello", etc.)
- Get straight to answering their question
- Always in English

EXAMPLE CONVERSATIONS:
- "What's my health goal?" → "Your primary health goal is [goal from profile]. Would you like tips on achieving it?"
- "Summarize the Heart Health card" → "**Heart Health Basics** covers [preview content]. Click the card to read the full content or use the play button to hear an audio summary!"
- "What can I do here?" → "You can: view your 2 educational cards, click cards for full content, download a PDF report, or ask me about your health information!"

Be helpful, accurate, and conversational!`;

              // Send session update with dashboard-specific instructions
              // Note: No tools/functions needed - context is auto-injected by backend
              const sessionConfig = {
                modalities: ['text', 'audio'],
                instructions: dashboardInstructions,
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                }
              };
              
              console.log('[Dashboard Agent] Sending session config:', sessionConfig);
              const success = realtimeSession.sendSessionUpdate(sessionConfig);
              
              if (success) {
                console.log('[Dashboard Agent] Dashboard-specific instructions sent successfully');
              } else {
                console.warn('[Dashboard Agent] Failed to send dashboard-specific instructions');
              }
            }
          }, 100); // Wait for connection to be fully established (minimal delay)
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize voice session:', error);
          setMessages(prev => [...prev, {
            id: `err_${Date.now()}`,
            role: 'assistant',
            text: 'Failed to connect. Please refresh and try again.',
            status: 'error',
            createdAt: Date.now()
          }]);
        }
      };
      initSession();
    }
  }, [isOpen, isInitialized, userId, realtimeSession, dashboardCards, userSession]);

  // Auto-scroll to latest message - only when NOT actively scrolling
  useEffect(() => {
    // Only auto-scroll when user is near the bottom (within 100px)
    const chatContainer = messagesEndRef.current?.parentElement;
    if (chatContainer) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Update assistant message status based on realtime session state
  useEffect(() => {
    const id = activeAssistantIdRef.current;
    if (!id) return;
    
    setMessages(prev => prev.map(m => {
      if (m.role !== 'assistant' || m.id !== id) return m;
      
      // Preserve paused state
      if ((m as any).status === 'paused') return m;
      
      if (realtimeSession.isPlaying) return { ...m, status: 'playing' } as any;
      if (realtimeSession.isProcessing) return { ...m, status: 'processing' } as any;
      
      // Mark as finished when streaming and playback are complete
      if (realtimeSession.isStreamComplete && realtimeSession.isPlaybackDrained) {
        return { ...m, status: 'finished' } as any;
      }
      
      return m;
    }));
    
    // Timeout handler: If stuck in "processing" for too long, show error
    if (realtimeSession.isProcessing) {
      const timeout = setTimeout(() => {
        if (activeAssistantIdRef.current === id && realtimeSession.isProcessing) {
          console.warn('[Dashboard Agent] Response timeout - AI took too long');
          setMessages(prev => prev.map(m => 
            m.id === id && m.role === 'assistant'
              ? { ...m, status: 'error', text: 'Sorry, I took too long to respond. Please try asking again.' } as any
              : m
          ));
          activeAssistantIdRef.current = null;
        }
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [realtimeSession.isProcessing, realtimeSession.isPlaying, realtimeSession.isStreamComplete, realtimeSession.isPlaybackDrained]);

  // Stream text from realtime session - SLOW DOWN TEXT GENERATION
  useEffect(() => {
    const id = activeAssistantIdRef.current;
    if (!id) return;
    
    const currentText = realtimeSession.visibleResponse;
    const fullText = realtimeSession.lastResponse;
    
    // If we have full text and current is shorter, we're still streaming
    if (fullText && currentText.length < fullText.length) {
      setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === id ? { ...m, text: currentText } : m)));
      textRevealCompleteRef.current = false;
      lastFullTextRef.current = fullText;
    }
    // If current equals full, streaming is complete - LOCK IT
    else if (fullText && currentText.length >= fullText.length && !textRevealCompleteRef.current) {
      setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === id ? { ...m, text: fullText } : m)));
      textRevealCompleteRef.current = true;
      lastFullTextRef.current = fullText;
      console.log('[Dashboard Agent] Text reveal complete - locked at full answer');
    }
    // If locked, don't update anymore
    else if (textRevealCompleteRef.current) {
      return;
    }
    // Fallback
    else {
      setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === id ? { ...m, text: currentText } : m)));
    }
  }, [realtimeSession.visibleResponse, realtimeSession.lastResponse]);

  // Handle voice transcript updates - PREVENT DUPLICATION
  useEffect(() => {
    const transcript = realtimeSession.currentTranscript?.trim();
    if (!transcript) return;
    
    // Prevent creating duplicate messages for the same transcript
    if (transcript === lastVoiceTranscriptRef.current) return;
    
    // Don't create voice messages if submitting text
    if (submittingRef.current) return;
    
    // Find or create voice user message
    setMessages(prev => {
      const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
      
      // If last message was text input, don't interfere
      if (lastUserMsg && (lastUserMsg as any).isTextInput) return prev;
      
      // Update existing voice message
      if (lastUserMsg && (lastUserMsg as any).isVoiceInput) {
        return prev.map(m => 
          m.id === lastUserMsg.id 
            ? { ...m, text: transcript }
            : m
        );
      }
      
      // Create new voice message
      const userMsg: ChatMessage = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        role: 'user',
        text: transcript,
        createdAt: Date.now(),
        isVoiceInput: true
      };
      activeUserIdRef.current = userMsg.id;
      return [...prev, userMsg];
    });
    
    lastVoiceTranscriptRef.current = transcript;
  }, [realtimeSession.currentTranscript]);

  // Small talk detection
  const isSmallTalk = (text: string): boolean => {
    const lower = text.toLowerCase();
    const patterns = ['hello', 'hi', 'hey', 'how are you', 'how about you', 'thank you', 'thanks', 'ok', 'okay', 'great', 'good'];
    return patterns.some(p => lower.includes(p));
  };

  // Meta-conversation detection
  const isMetaQuestion = (text: string): boolean => {
    const lower = text.toLowerCase();
    const patterns = ['what can you', 'what can i', 'how can you', 'help me', 'what does', 'how do i', 'what is this', 'explain'];
    return patterns.some(p => lower.includes(p));
  };

  // Check if related to dashboard or health topic
  const isRelatedToTopic = (text: string): boolean => {
    if (topicKeywords.length === 0) return true;
    const lower = text.toLowerCase();
    return topicKeywords.some(keyword => lower.includes(keyword));
  };

  // Handle text submission
  const handleTextSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed || submittingRef.current || !isInitialized) return;
    
    submittingRef.current = true;
    
    // Interrupt any active assistant response
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && ['processing', 'playing', 'paused'].includes((m as any).status));
    if (lastAssistant) {
      realtimeSession.bargeIn();
      realtimeSession.clearBuffers();
      setMessages(prev => prev.map(m => (m.id === lastAssistant.id ? { ...(m as any), status: 'stopped' } : m)));
      activeAssistantIdRef.current = null;
    }
    
    // Add user message
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      role: 'user',
      text: trimmed,
      createdAt: Date.now(),
      isTextInput: true
    };
    setMessages(prev => [...prev, userMsg]);
    activeUserIdRef.current = userMsg.id;
    
    // Topic filtering - be more lenient for dashboard questions
    if (!isSmallTalk(trimmed) && !isMetaQuestion(trimmed) && !isRelatedToTopic(trimmed)) {
      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: `I'm here to help with this Dashboard page - its cards, features, and your health information. You can ask me: "What cards do I have?", "Explain [card name]", "How do I download the report?", or "What can you help me with?"`,
        status: 'finished',
        createdAt: Date.now()
      }]);
      setTextInput('');
      setTimeout(() => { submittingRef.current = false; }, 100);
      return;
    }
    
    // Add placeholder assistant message
    const asstId = `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    activeAssistantIdRef.current = asstId;
    setMessages(prev => [...prev, {
      id: asstId,
      role: 'assistant',
      status: 'processing',
      createdAt: Date.now()
    }]);
    
    // Reset text reveal state
    textRevealCompleteRef.current = false;
    lastFullTextRef.current = '';
    
    // Send to AI
    realtimeSession.sendText(trimmed);
    setTextInput('');
    setTimeout(() => { submittingRef.current = false; }, 100);
  }, [textInput, isInitialized, messages, realtimeSession, isSmallTalk, isMetaQuestion, isRelatedToTopic]);

  // Handle quick chip click
  const handleChipClick = (chipText: string) => {
    setTextInput(chipText);
    inputRef.current?.focus();
  };

  // Toggle mic (push-to-talk) - PREVENT DUPLICATION
  const toggleMic = () => {
    if (!isInitialized) return;
    
    if (realtimeSession.isListening) {
      // Stop listening and create assistant placeholder ONCE
      realtimeSession.stopListening();
      
      const asstId = `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      activeAssistantIdRef.current = asstId;
      setMessages(prev => [...prev, {
        id: asstId,
        role: 'assistant',
        status: 'processing',
        createdAt: Date.now()
      }]);
      
      // Reset text reveal
      textRevealCompleteRef.current = false;
      lastFullTextRef.current = '';
      
    } else {
      // Start listening
      realtimeSession.clearError();
      
      // Interrupt any active response
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && ['processing', 'playing', 'paused'].includes((m as any).status));
      if (lastAssistant) {
        realtimeSession.bargeIn();
        realtimeSession.clearBuffers();
        setMessages(prev => prev.map(m => (m.id === lastAssistant.id ? { ...(m as any), status: 'stopped' } : m)));
        activeAssistantIdRef.current = null;
      }
      
      realtimeSession.startListening();
      
      // Reset voice transcript tracker
      lastVoiceTranscriptRef.current = '';
    }
  };

  // Pause/Resume current response
  const togglePauseResume = () => {
    const asstId = activeAssistantIdRef.current;
    if (!asstId) return;
    
    setMessages(prev => prev.map(m => {
      if (m.role === 'assistant' && m.id === asstId) {
        if ((m as any).status === 'paused') {
          console.log('[Dashboard Agent] Resume clicked');
          realtimeSession.resumeOutput();
          return { ...m, status: 'playing' } as any;
        }
        if (['playing', 'processing'].includes((m as any).status as any)) {
          console.log('[Dashboard Agent] Pause clicked');
          realtimeSession.pauseOutput();
          return { ...m, status: 'paused' } as any;
        }
      }
      return m;
    }));
  };

  // Stop current response
  const stopResponse = () => {
    const asstId = activeAssistantIdRef.current;
    if (!asstId) return;
    
    console.log('[Dashboard Agent] Stop clicked');
    realtimeSession.bargeIn();
    realtimeSession.clearBuffers();
    setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === asstId ? { ...(m as any), status: 'stopped' } : m)));
    activeAssistantIdRef.current = null;
  };

  // Quick suggestion chips
  const quickChips = [
    'What can I do here?',
    'Explain this page',
    'What cards do I have?',
    `Tell me about ${dashboardCards[0]?.title || 'the first card'}`
  ];

  // Determine FAB ring color based on agent state
  const getFABRingColor = () => {
    if (realtimeSession.isListening) return 'ring-4 ring-blue-500 animate-pulse';
    if (realtimeSession.isProcessing) return 'ring-4 ring-amber-400';
    if (realtimeSession.isPlaying) return 'ring-4 ring-green-400 animate-pulse';
    return 'ring-2 ring-gray-300 hover:ring-blue-400';
  };

  // Check if there's an active response that can be paused/stopped
  const activeResponse = messages.find(m => 
    m.role === 'assistant' && 
    m.id === activeAssistantIdRef.current && 
    ['processing', 'playing', 'paused'].includes((m as any).status)
  );

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className={`w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 ${getFABRingColor()}`}
            aria-label="Open Voice Assistant"
          >
            {/* Try to use user-provided head image, fallback to avatar loop */}
            <div className="w-16 h-16 rounded-full overflow-hidden relative">
              {hasCustomImage ? (
                <img 
                  src="/assets/voice/agent-head.png" 
                  alt="Voice Agent"
                  className="w-full h-full object-cover"
                  onError={() => setHasCustomImage(false)}
                />
              ) : (
                <AvatarLoop isPlaying={realtimeSession.isPlaying} />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Popup Window - Resizable & Draggable */}
      {isOpen && (
        <Rnd
          default={{
            x: window.innerWidth - 624, // 24px from right (right-6 = 24px)
            y: window.innerHeight - 664, // 24px from bottom (bottom-6 = 24px) 
            width: 600,
            height: 640
          }}
          minWidth={400}
          minHeight={500}
          maxWidth={900}
          maxHeight={800}
          bounds="window"
          dragHandleClassName="drag-handle"
          className="z-50"
          style={{ position: 'fixed' }}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
        >
          <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header - Draggable */}
            <div className="drag-handle cursor-move flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden relative border-2 border-white shadow-md">
                {hasCustomImage ? (
                  <img 
                    src="/assets/voice/agent-head.png" 
                    alt="Voice Agent"
                    className="w-full h-full object-cover"
                    onError={() => setHasCustomImage(false)}
                  />
                ) : (
                  <AvatarLoop isPlaying={realtimeSession.isPlaying} />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Voice Assistant</h3>
                <p className="text-xs text-gray-500">Dashboard Help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Quick Chips */}
          <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap gap-2">
            {quickChips.map(chip => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 text-sm rounded-full bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8 px-4">
                <div className="mb-3 text-3xl">👋</div>
                <p className="font-medium mb-2">Hi! I can help you with this Dashboard.</p>
                <p className="text-xs">Ask me about the {dashboardCards.length} cards, page features, or how to use anything here!</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm shadow-sm">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm shadow-sm ${
                      msg.status === 'error' 
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : msg.status === 'stopped'
                        ? 'bg-gray-100 text-gray-500 border border-gray-300'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      {msg.text ? (
                        <BoldTextRenderer text={msg.text} />
                      ) : (
                        msg.status === 'processing' ? 'Thinking...' : msg.status === 'playing' ? '...' : ''
                      )}
                      {msg.status === 'stopped' && !msg.text && <span className="italic">Response stopped</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Status Bar with Controls */}
          <div className="px-4 py-2 border-t bg-white flex items-center justify-between">
            <div className="text-xs text-gray-600 flex items-center gap-2">
              {realtimeSession.isListening && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Listening... (click Mic to stop)
                </span>
              )}
              {realtimeSession.isProcessing && !realtimeSession.isListening && '⏳ Processing...'}
              {realtimeSession.isPlaying && '🔊 Speaking...'}
              {!realtimeSession.isListening && !realtimeSession.isProcessing && !realtimeSession.isPlaying && (
                <span className="text-green-600">✓ Ready to help!</span>
              )}
            </div>
            
            {/* Pause/Resume/Stop Controls */}
            {activeResponse && (
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePauseResume}
                  className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full transition-colors"
                  title={(activeResponse as any).status === 'paused' ? 'Resume' : 'Pause'}
                >
                  {(activeResponse as any).status === 'paused' ? (
                    <Play className="w-3.5 h-3.5" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={stopResponse}
                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors"
                  title="Stop"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleTextSubmit} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isInitialized || realtimeSession.isListening}
              />
              <button
                type="submit"
                disabled={!textInput.trim() || !isInitialized || realtimeSession.isListening}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleMic}
                disabled={!isInitialized}
                className={`px-4 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md ${
                  realtimeSession.isListening 
                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:bg-gray-200 disabled:cursor-not-allowed`}
                title={realtimeSession.isListening ? 'Stop speaking' : 'Start speaking (Push-to-talk)'}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </form>
          </div>
        </Rnd>
      )}
    </>
  );
};

export default DashboardVoiceAgent;
