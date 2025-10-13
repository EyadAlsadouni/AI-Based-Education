'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Mic, Send, Square, Pause, Play } from 'lucide-react';
import { voiceApi } from '../../lib/api';
import { useOpenAIRealtime } from '../../lib/useOpenAIRealtime';
import { AvatarLoop } from './AvatarLoop';
import { BoldTextRenderer } from './BoldTextRenderer';

interface DashboardVoiceAgentProps {
  userId: number;
  dashboardCards?: any[];
  userSession?: any;
  selectedCard?: { title: string; content: string; icon: string } | null;
  dashboardContent?: any;
}

type ChatMessage = 
  | { id: string; role: 'user'; text: string; createdAt: number; isVoiceInput?: boolean; isTextInput?: boolean }
  | { id: string; role: 'assistant'; text?: string; status: 'processing' | 'playing' | 'paused' | 'finished' | 'stopped' | 'error'; createdAt: number };

// OpenAI Realtime API Voice Options
const VOICE_AGENT_VOICE = 'onyx';

export const DashboardVoiceAgent: React.FC<DashboardVoiceAgentProps> = ({
  userId,
  dashboardCards = [],
  userSession,
  selectedCard = null,
  dashboardContent = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [hasShownGreeting, setHasShownGreeting] = useState(false);
  
  // Dragging and resizing state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 600, height: 640 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const realtimeSession = useOpenAIRealtime();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const textRevealCompleteRef = useRef<boolean>(false);
  const lastFullTextRef = useRef<string>('');
  const lastVoiceTranscriptRef = useRef<string>('');
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasCustomImage, setHasCustomImage] = useState<boolean>(true);
  // CRITICAL: Track last known card count to detect when dashboard is regenerated
  const lastCardCountRef = useRef<number>(dashboardCards?.length || 0);
  const dashboardContentHashRef = useRef<string>('');

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

  // Build session instructions dynamically
  const buildSessionInstructions = useCallback(() => {
    const openedCardContext = selectedCard ? `

🎯 **CURRENTLY VIEWING**: The user has opened the **${selectedCard.title}** card right now.
When they say "this", "it", "this card", "explain this", "summarize this", they are referring to **${selectedCard.title}**.
You have access to the FULL content of this card to answer their questions accurately.` : '';

    const cardSummary = dashboardCards && dashboardCards.length > 0 
      ? `The user currently has ${dashboardCards.length} educational cards: ${dashboardCards.map(c => c.title).join(', ')}.`
      : 'The user has no cards yet.';

    return `You are ${userSession?.full_name || 'the user'}'s intelligent Dashboard Assistant - an AI helper that understands what they're looking at and doing.

🎯 VISUAL CONTEXT AWARENESS:${openedCardContext}

CURRENT DASHBOARD STATE:
${cardSummary}

WHAT YOU KNOW:
Before every question, you automatically receive:
- User profile (name, condition, health goals, medications)
- All dashboard cards with FULL content (not just previews)
- Which card (if any) is currently open on their screen
- Available page features and actions

FLEXIBLE QUESTION UNDERSTANDING:
✅ "this", "that", "it" → Refers to the currently open card
✅ "summarize this" → Summarize the open card's content
✅ "explain" / "tell me more" → Provide detailed explanation
✅ "give me 3 bullet points" → Format response as requested
✅ "what's in this card?" → Describe the open card's content
✅ "how many cards do I have?" → Answer with the current count (${dashboardCards?.length || 0})
✅ Follow-up questions → Remember conversation context

HOW TO RESPOND:
1. **Be context-aware**: If a card is open and they ask "explain this", you KNOW they mean that card
2. **Read full content**: You have access to the COMPLETE card content, not just previews
3. **Stay updated**: Always use the CURRENT card count and data - if the user regenerated their dashboard, you'll have the latest information
4. **Format flexibly**: If they ask for bullet points, give bullets. If they ask for a summary, summarize.
5. **Be conversational**: Handle follow-ups naturally, like "what about exercise?" after discussing diet
6. **Use bold formatting**: Use **bold** for card titles and key terms
7. **Be proactive**: Suggest related actions like "Would you like me to explain [another topic]?"

RESPONSE STYLE:
- Like NotebookLM - intelligent, context-aware, helpful assistant
- Warm but professional (health coach + smart assistant hybrid)
- Conversational and natural (not robotic)
- Clear and concise
- Get straight to the answer - NO GREETINGS unless user says "hi" or "hello"
- If user asks a specific question, answer it immediately - don't say "Hello! How can I help?"
- Always in English

EXAMPLE INTERACTIONS:
User: "How many cards do I have?"
You: "You currently have ${dashboardCards?.length || 0} educational cards on your dashboard."

User: [Opens "Mood Regulation" card, then asks] "Explain this"
You: "**Mood Regulation** helps you understand how to manage emotional ups and downs with diabetes. The card covers [specific content from the card]... Would you like me to break this down into specific strategies?"

User: "Give me 4 bullet points about this"
You: "Here are 4 key points from **Mood Regulation**:
- [Point 1 from actual content]
- [Point 2 from actual content]
- [Point 3 from actual content]
- [Point 4 from actual content]"

Be smart, flexible, and truly helpful!`;
  }, [dashboardCards, userSession, selectedCard]);

  // Initialize voice session with dashboard-specific system instructions
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initSession = async () => {
        try {
          const session = await voiceApi.createSession(userId, 'en', 'dashboard');
          setSessionId(session.session_id);
          
          // Connect to realtime session - skip default instructions, specify dashboard type
          await realtimeSession.connect(userId, session.session_id, true, 'dashboard');
          
          // Send dashboard-specific session configuration immediately after connection
          setTimeout(() => {
            if (realtimeSession.isConnected) {
              console.log('[Dashboard Agent] Sending dashboard-specific instructions...');
              
              const dashboardInstructions = buildSessionInstructions();

              // Send session update with dashboard-specific instructions
              const sessionConfig = {
                modalities: ['text', 'audio'],
                instructions: dashboardInstructions,
                voice: VOICE_AGENT_VOICE,
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                }
              };
              
              console.log('[Dashboard Agent] 🎤 Using voice:', VOICE_AGENT_VOICE);
              console.log('[Dashboard Agent] 📊 Current card count:', dashboardCards?.length || 0);
              const success = realtimeSession.sendSessionUpdate(sessionConfig);
              
              if (success) {
                console.log('[Dashboard Agent] ✅ Dashboard-specific instructions sent successfully');
                // Store initial card count
                lastCardCountRef.current = dashboardCards?.length || 0;
                // Store initial dashboard content hash
                dashboardContentHashRef.current = JSON.stringify(dashboardContent);
              } else {
                console.warn('[Dashboard Agent] ❌ Failed to send dashboard-specific instructions');
              }
            }
          }, 100);
          
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
  }, [isOpen, isInitialized, userId, realtimeSession, buildSessionInstructions, dashboardCards, dashboardContent]);

  // CRITICAL: Watch for dashboard changes (when user regenerates dashboard)
  useEffect(() => {
    if (!isInitialized || !realtimeSession.isConnected) return;
    
    const currentCardCount = dashboardCards?.length || 0;
    const currentContentHash = JSON.stringify(dashboardContent);
    
    // Check if dashboard has changed (card count or content changed)
    const cardsChanged = currentCardCount !== lastCardCountRef.current;
    const contentChanged = currentContentHash !== dashboardContentHashRef.current;
    
    if (cardsChanged || contentChanged) {
      console.log('[Dashboard Agent] 🔄 Dashboard data changed!');
      console.log('[Dashboard Agent] Previous card count:', lastCardCountRef.current);
      console.log('[Dashboard Agent] New card count:', currentCardCount);
      console.log('[Dashboard Agent] Content changed:', contentChanged);
      console.log('[Dashboard Agent] Refreshing AI context...');
      
      // Update stored values
      lastCardCountRef.current = currentCardCount;
      dashboardContentHashRef.current = currentContentHash;
      
      // Refresh AI instructions with new data
      const updatedInstructions = buildSessionInstructions();
      
      const sessionConfig = {
        modalities: ['text', 'audio'],
        instructions: updatedInstructions,
        voice: VOICE_AGENT_VOICE,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        }
      };
      
      const success = realtimeSession.sendSessionUpdate(sessionConfig);
      if (success) {
        console.log('[Dashboard Agent] ✅ AI context updated with new dashboard data');
        console.log('[Dashboard Agent] ✅ AI now knows about', currentCardCount, 'cards');
      } else {
        console.warn('[Dashboard Agent] ❌ Failed to update AI context');
      }
    }
  }, [dashboardCards, dashboardContent, isInitialized, realtimeSession.isConnected, buildSessionInstructions]);

  // Update instructions when selectedCard changes
  useEffect(() => {
    if (!isInitialized || !realtimeSession.isConnected) return;
    
    console.log('[Dashboard Agent] 🎯 selectedCard changed:', selectedCard?.title || 'None');
    
    const updatedInstructions = buildSessionInstructions();

    // Send updated session config
    const sessionConfig = {
      modalities: ['text', 'audio'],
      instructions: updatedInstructions,
      voice: VOICE_AGENT_VOICE,
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1'
      }
    };
    
    const success = realtimeSession.sendSessionUpdate(sessionConfig);
    if (success) {
      console.log('[Dashboard Agent] ✅ Instructions updated with new card context');
    }
  }, [selectedCard, isInitialized, realtimeSession.isConnected, buildSessionInstructions]);

  // Set initial position when popup opens
  useEffect(() => {
    if (isOpen && position.x === 0 && position.y === 0) {
      const x = window.innerWidth - 624;
      const y = window.innerHeight - 664;
      setPosition({ x, y });
    }
  }, [isOpen, position]);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;

      // Handle horizontal resizing
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(400, Math.min(1200, resizeStart.width + deltaX));
      } else if (resizeDirection.includes('w')) {
        const widthChange = Math.max(400, Math.min(1200, resizeStart.width - deltaX));
        if (widthChange !== resizeStart.width) {
          newWidth = widthChange;
          newX = resizeStart.posX + (resizeStart.width - widthChange);
        }
      }

      // Handle vertical resizing
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(500, Math.min(900, resizeStart.height + deltaY));
      } else if (resizeDirection.includes('n')) {
        const heightChange = Math.max(500, Math.min(900, resizeStart.height - deltaY));
        if (heightChange !== resizeStart.height) {
          newHeight = heightChange;
          newY = resizeStart.posY + (resizeStart.height - heightChange);
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeDirection]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Handle resize from any direction
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y
    });
  }, [size, position]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Auto-scroll to latest message - only when NOT actively scrolling
  useEffect(() => {
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
    
    // IMPROVED: Faster timeout for stuck responses
    if (realtimeSession.isProcessing) {
      const timeout = setTimeout(() => {
        if (activeAssistantIdRef.current === id && realtimeSession.isProcessing) {
          console.warn('[Dashboard Agent] ⏰ Response timeout - AI took too long');
          setMessages(prev => prev.map(m => 
            m.id === id && m.role === 'assistant'
              ? { ...m, status: 'error', text: 'Sorry, I took too long to respond. Please try asking again.' } as any
              : m
          ));
          activeAssistantIdRef.current = null;
          // Clear timeout ref
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current);
            responseTimeoutRef.current = null;
          }
        }
      }, 20000); // 20 second timeout (reduced from 15 for better balance)
      
      return () => clearTimeout(timeout);
    }
  }, [realtimeSession.isProcessing, realtimeSession.isPlaying, realtimeSession.isStreamComplete, realtimeSession.isPlaybackDrained]);

  // Stream text from realtime session - IMPROVED synchronization
  useEffect(() => {
    const id = activeAssistantIdRef.current;
    if (!id) return;
    
    const currentText = realtimeSession.visibleResponse;
    const fullText = realtimeSession.lastResponse;
    
    // Clear timeout when we start receiving response
    if (fullText && fullText.length > 0 && responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
    
    // IMPROVED: Better text locking logic
    // If we have full text and current equals or exceeds it, we're done
    if (fullText && currentText.length >= fullText.length && !textRevealCompleteRef.current) {
      setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === id ? { ...m, text: fullText } : m)));
      textRevealCompleteRef.current = true;
      lastFullTextRef.current = fullText;
      console.log('[Dashboard Agent] ✅ Text reveal complete - locked');
      return;
    }
    
    // If locked, don't update anymore
    if (textRevealCompleteRef.current && fullText === lastFullTextRef.current) {
      return;
    }
    
    // Otherwise, update with current visible text
    if (currentText || fullText) {
      setMessages(prev => prev.map(m => (m.role === 'assistant' && m.id === id ? { ...m, text: currentText } : m)));
    }
  }, [realtimeSession.visibleResponse, realtimeSession.lastResponse]);

  // Handle voice transcript updates - IMPROVED duplication prevention
  useEffect(() => {
    const transcript = realtimeSession.currentTranscript?.trim();
    if (!transcript) return;
    
    // CRITICAL: Prevent creating duplicate messages for the same transcript
    if (transcript === lastVoiceTranscriptRef.current) {
      return;
    }
    
    // Don't create voice messages if submitting text
    if (submittingRef.current) {
      return;
    }
    
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

  // Follow-up question detection
  const isFollowUp = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    const followUpPatterns = [
      'yes', 'no', 'yeah', 'nope', 'sure', 'of course',
      'tell me more', 'go deeper', 'continue', 'go on', 
      'what about', 'how about', 'and', 'also',
      'more', 'less', 'another', 'different',
      'same', 'similar', 'like that', 'like this',
      'elaborate', 'expand', 'detail', 'explain more'
    ];
    const wordCount = lower.split(' ').length;
    if (wordCount <= 3) {
      return followUpPatterns.some(p => lower === p || lower.includes(p));
    }
    return followUpPatterns.some(p => lower.startsWith(p));
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
    
    // Topic filtering - be very lenient
    if (!isSmallTalk(trimmed) && !isMetaQuestion(trimmed) && !isFollowUp(trimmed) && !isRelatedToTopic(trimmed)) {
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
    
    // Clear any existing timeout
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    
    // Set response timeout (20 seconds)
    responseTimeoutRef.current = setTimeout(() => {
      console.warn('[Dashboard Agent] ⏱️ Response timeout - AI took too long');
      setMessages(prev => prev.map(m => {
        if (m.id === asstId && (m as any).status === 'processing') {
          return {
            ...m,
            text: "I apologize, but I'm taking longer than expected to respond. Please try asking your question again.",
            status: 'error'
          } as any;
        }
        return m;
      }));
      activeAssistantIdRef.current = null;
      responseTimeoutRef.current = null;
    }, 20000);
    
    // Send to AI with card context if a card is open
    let messageToSend = trimmed;
    if (selectedCard) {
      messageToSend = `[Context: User currently has "${selectedCard.title}" card open] ${trimmed}`;
      console.log('[Dashboard Agent] 🎯 Sending message with card context:', selectedCard.title);
    }
    realtimeSession.sendText(messageToSend);
    setTextInput('');
    setTimeout(() => { submittingRef.current = false; }, 100);
  }, [textInput, isInitialized, messages, realtimeSession, isSmallTalk, isMetaQuestion, isFollowUp, isRelatedToTopic, selectedCard]);

  // Handle quick chip click
  const handleChipClick = (chipText: string) => {
    setTextInput(chipText);
    inputRef.current?.focus();
  };

  // Toggle mic (push-to-talk) - IMPROVED duplication prevention
  const toggleMic = () => {
    if (!isInitialized) return;
    
    if (realtimeSession.isListening) {
      // Stop listening and create assistant placeholder ONCE
      realtimeSession.stopListening();
      
      // CRITICAL: Response creation is now handled in useOpenAIRealtime.ts stopListening
      // Just prepare UI for response
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
      
      console.log('[Dashboard Agent] 🎤 Mic stopped - waiting for response');
      
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
      
      console.log('[Dashboard Agent] 🎤 Mic started - listening');
    }
  };

  // Pause/Resume current response
  const togglePauseResume = () => {
    const asstId = activeAssistantIdRef.current;
    if (!asstId) return;
    
    setMessages(prev => prev.map(m => {
      if (m.role === 'assistant' && m.id === asstId) {
        if ((m as any).status === 'paused') {
          realtimeSession.resumeOutput();
          return { ...m, status: 'playing' } as any;
        }
        if (['playing', 'processing'].includes((m as any).status as any)) {
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
    'How many cards do I have?',
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
          <div className="group relative">
            <button
              onClick={() => setIsOpen(true)}
              className={`w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center transition-all hover:scale-105 ${getFABRingColor()}`}
              aria-label="Ask AI Assistant"
            >
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
            
            {/* Help Label */}
            <div className="absolute right-24 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                Ask AI Assistant
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Window */}
      {isOpen && (
        <div
          ref={popupRef}
          className="fixed z-50"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden relative">
            {/* Header */}
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
                  Listening...
                </span>
              )}
              {realtimeSession.isProcessing && !realtimeSession.isListening && '⏳ Processing...'}
              {realtimeSession.isPlaying && '🔊 Speaking...'}
              {!realtimeSession.isListening && !realtimeSession.isProcessing && !realtimeSession.isPlaying && (
                <span className="text-green-600">✓ Ready!</span>
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
                title={realtimeSession.isListening ? 'Stop speaking' : 'Start speaking'}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          {/* Resize Handles */}
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'n')} className="absolute top-0 left-3 right-3 h-1 cursor-n-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 's')} className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'w')} className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize" />
          <div onMouseDown={(e) => handleResizeMouseDown(e, 'e')} className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize" />
          
          {/* Visual indicator for bottom-right corner */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #cbd5e1 50%)'
            }}
          />
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardVoiceAgent;
