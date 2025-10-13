'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { aiApi, userApi, handleApiError, voiceApi } from '../../lib/api';
import { formStorage, format, error as errorUtils } from '../../lib/utils';
import { DASHBOARD_CARDS, generateDashboardCards, DashboardCard } from '../../lib/constants';
import { DashboardContent, UserSession } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import AudioManager from '../../lib/useAudioManager';
import { DashboardVoiceAgent } from '../voice/DashboardVoiceAgent';
import { Rnd } from 'react-rnd';

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};





interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  icon: string;
  highlightedText?: string;
  isHighlighting?: boolean;
  isPlaying?: boolean;
  isPaused?: boolean;
  isGenerating?: boolean;
  audioDuration?: number;
  audioCurrentTime?: number;
  onPlayPause?: () => void;
  onStop?: () => void;
}

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  icon,
  highlightedText = '',
  isHighlighting = false,
  isPlaying = false,
  isPaused = false,
  isGenerating = false,
  audioDuration = 0,
  audioCurrentTime = 0,
  onPlayPause,
  onStop
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <Rnd
        default={{
          x: window.innerWidth / 2 - 400,
          y: 50,
          width: 800,
          height: Math.min(window.innerHeight - 100, 700)
        }}
        minWidth={600}
        minHeight={400}
        maxWidth={1200}
        maxHeight={window.innerHeight - 100}
        bounds="parent"
        dragHandleClassName="modal-drag-handle"
        style={{ position: 'relative' }}
      >
        <div className="bg-white rounded-lg w-full h-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
          {/* Modal Header - Draggable */}
          <div className="modal-drag-handle cursor-move bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                {icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">Evidence-based patient education content</p>
              </div>
            </div>
            
            {/* Audio Controls and Progress Bar */}
            <div className="flex items-center space-x-4">
              {/* Audio Progress Bar */}
              {(isPlaying || isPaused) && audioDuration > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
                  </span>
                </div>
              )}
              
              {/* Audio Control Buttons */}
              {onPlayPause && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onPlayPause}
                    disabled={isGenerating}
                    className={`p-2 rounded-full transition-all hover:scale-110 ${
                      isGenerating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPlaying
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : isPaused
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title={isGenerating ? 'Generating audio...' : isPlaying ? 'Pause audio' : isPaused ? 'Resume audio' : 'Play audio'}
                  >
                    {isGenerating ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                    ) : isPlaying ? (
                      <VolumeX className="h-4 w-4" />
                    ) : isPaused ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                  
                  {onStop && (isPlaying || isPaused) && (
                    <button
                      onClick={onStop}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      title="Stop audio"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h12v12H6z"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="prose prose-gray max-w-none pb-8">
            {(() => {
              console.log('ContentModal - Content length:', content.length, 'Content preview:', content.substring(0, 200) + '...');
              return content.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null;
              
              // Check if this is the References section
              if (paragraph.trim().toLowerCase().startsWith('references:')) {
                return (
                  <div key={index} className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">📚</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">{paragraph.trim()}</h4>
                    </div>
                  </div>
                );
              }
              
              // Check if this is a reference line [1] ...
              const referenceMatch = paragraph.match(/^\[(\d+)\]\s*(.+)$/);
              if (referenceMatch) {
                const [, refNumber, refText] = referenceMatch;
                // Extract URL if present
                const urlMatch = refText.match(/(https?:\/\/[^\s]+)/);
                const textBeforeUrl = urlMatch ? refText.substring(0, refText.indexOf(urlMatch[0])).trim() : refText;
                const url = urlMatch ? urlMatch[0] : null;
                
                return (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-xs font-bold">{refNumber}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-gray-700 text-sm leading-relaxed">{textBeforeUrl}</span>
                        {url && (
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block mt-2 text-blue-600 hover:text-blue-800 underline text-sm break-all"
                          >
                            {url}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Regular paragraph processing
              const parts = paragraph.split(/\*\*(.*?)\*\*/g);
              
              return (
                <div key={index} className="mb-4 leading-relaxed">
                  {parts.map((part, partIndex) => {
                    if (partIndex % 2 === 1) {
                      return <strong key={partIndex} className="font-bold text-gray-900">{part}</strong>;
                    }
                    
                    
                    // Apply highlighting if active - use a more subtle approach
                    if (isHighlighting && highlightedText && highlightedText.length > 0) {
                      const highlightedWords = highlightedText.split(' ').filter(w => w.length > 0);
                      
                      // Calculate global word position for this part
                      const contentBeforeThisPart = content
                        .split('\n')
                        .slice(0, index)
                        .join(' ')
                        .replace(/\*\*(.*?)\*\*/g, '$1')
                        .replace(/\[(\d+)\]/g, '')
                        .replace(/https?:\/\/[^\s]+/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                      
                      const wordsBeforeThisPart = contentBeforeThisPart.split(' ').filter(w => w.length > 0).length;
                      
                      // Use a single span with background highlighting for the entire part
                      const currentWords = part.split(' ');
                      const wordsToHighlight = Math.min(highlightedWords.length - wordsBeforeThisPart, currentWords.length);
                      
                      if (wordsToHighlight > 0) {
                        const highlightedPart = currentWords.slice(0, wordsToHighlight).join(' ');
                        const remainingPart = currentWords.slice(wordsToHighlight).join(' ');
                        
                        return (
                          <span key={partIndex}>
                            <span className="bg-yellow-200 transition-all duration-100" style={{ padding: '0 1px' }}>
                              {highlightedPart}
                            </span>
                            {remainingPart && <span> {remainingPart}</span>}
                          </span>
                        );
                      }
                    }
                    
                    // Check for reference numbers [1], [2], etc. and make them stand out
                    const textWithRefs = part.split(/(\[\d+\])/);
                    
                    return textWithRefs.map((textPart, textIndex) => {
                      if (/\[\d+\]/.test(textPart)) {
                        return (
                          <span key={textIndex} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mx-1">
                            {textPart}
                          </span>
                        );
                      }
                      
                      // Check for URLs in the text and make them clickable
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const urlParts = textPart.split(urlRegex);
                      
                      return urlParts.map((urlPart, urlIndex) => {
                        if (urlRegex.test(urlPart)) {
                          return (
                            <a 
                              key={urlIndex} 
                              href={urlPart} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all font-medium"
                            >
                              {urlPart}
                            </a>
                          );
                        }
                        return <span key={urlIndex} className="text-gray-700">{urlPart}</span>;
                      });
                    });
                  })}
                </div>
              );
              });
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <span>Content generated by AI • Evidence-based information</span>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </div>
        </div>
      </Rnd>
    </div>
  );
};

export const DashboardComponent: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [dashboardContent, setDashboardContent] = useState<DashboardContent | null>(null);
  const [selectedCard, setSelectedCard] = useState<{ title: string; content: string; icon: string } | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [dynamicCards, setDynamicCards] = useState<DashboardCard[]>([]);
  
  // Voice reading states
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dashboardAudioManager] = useState(() => AudioManager.getInstance());
  
  // Right panel toggle
  const [showRightPanel, setShowRightPanel] = useState(true);
  
  // Audio progress and highlighting states
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [highlightedText, setHighlightedText] = useState<string>('');
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [speakingRate, setSpeakingRate] = useState<number | null>(null);

  // Audio event handlers for voice reading
  useEffect(() => {
    const handleStart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setIsHighlighting(true);
      setHighlightedText(''); // Reset highlighting
      setSpeakingRate(null); // Reset speaking rate for new audio
      console.log('[Dashboard AudioManager] start - highlighting enabled');
    };
    const handleEnd = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setPlayingCardId(null);
      setIsHighlighting(false);
      setHighlightedText('');
      console.log('[Dashboard AudioManager] end');
    };
    const handleError = (err: any) => {
      setIsPlaying(false);
      setIsPaused(false);
      setPlayingCardId(null);
      setIsHighlighting(false);
      setHighlightedText('');
      setError('Failed to play audio');
      console.log('[Dashboard AudioManager] error', err);
    };
    const handleProgress = (currentTime: number, duration: number) => {
      setAudioCurrentTime(currentTime);
      setAudioDuration(duration);
      
      // Improved text highlighting with better audio sync
      if (isHighlighting && selectedCard && duration > 0) {
        const content = selectedCard.content;
        
        // Clean the content for better word counting (remove markdown, references, etc.)
        const cleanContent = content
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
          .replace(/\[(\d+)\]/g, '') // Remove reference numbers
          .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
          .replace(/\n+/g, ' ') // Replace newlines with spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        const words = cleanContent.split(' ').filter(word => word.length > 0);
        
        // Use a more sophisticated progress calculation
        const progressRatio = Math.min(currentTime / duration, 1);
        
        // Calculate actual speaking rate if we have enough data
        if (currentTime > 2 && words.length > 0) {
          const currentWordsPerSecond = (words.length * progressRatio) / currentTime;
          if (!speakingRate || Math.abs(currentWordsPerSecond - speakingRate) > 0.5) {
            setSpeakingRate(currentWordsPerSecond);
          }
        }
        
        // Use adaptive highlighting based on actual speaking rate
        let adjustedRatio = progressRatio;
        
        if (speakingRate && speakingRate > 0) {
          // Use the actual speaking rate to calculate expected progress
          const expectedWords = Math.floor(currentTime * speakingRate);
          const expectedRatio = Math.min(expectedWords / words.length, 1);
          
          // Blend the linear progress with the speaking rate based progress
          adjustedRatio = (progressRatio * 0.3) + (expectedRatio * 0.7);
        } else {
          // Fallback to adjusted linear progress
          // Early in the audio (first 15%), be more conservative
          if (progressRatio < 0.15) {
            adjustedRatio = progressRatio * 0.7;
          }
          // Middle section (15% to 85%), use normal progression
          else if (progressRatio < 0.85) {
            adjustedRatio = 0.105 + (progressRatio - 0.15) * 1.0;
          }
          // End section (last 15%), slow down
          else {
            adjustedRatio = 0.805 + (progressRatio - 0.85) * 0.6;
          }
        }
        
        // Ensure we don't go beyond 100%
        adjustedRatio = Math.min(adjustedRatio, 1);
        
        const wordsToHighlight = Math.floor(adjustedRatio * words.length);
        
        // Get the highlighted text with proper spacing
        const highlightedWords = words.slice(0, wordsToHighlight);
        setHighlightedText(highlightedWords.join(' '));
        
        console.log(`Highlighting: ${wordsToHighlight}/${words.length} words (${(progressRatio * 100).toFixed(1)}% -> ${(adjustedRatio * 100).toFixed(1)}%) [Rate: ${speakingRate?.toFixed(1) || 'N/A'} wps]`);
      }
    };
    const handleDuration = (duration: number) => {
      setAudioDuration(duration);
    };
    
    dashboardAudioManager.on('start', handleStart);
    dashboardAudioManager.on('end', handleEnd);
    dashboardAudioManager.on('error', handleError);
    dashboardAudioManager.on('progress', handleProgress);
    dashboardAudioManager.on('duration', handleDuration);
    
    return () => {
      dashboardAudioManager.off('start', handleStart);
      dashboardAudioManager.off('end', handleEnd);
      dashboardAudioManager.off('error', handleError);
      dashboardAudioManager.off('progress', handleProgress);
      dashboardAudioManager.off('duration', handleDuration);
    };
  }, [dashboardAudioManager, isHighlighting, selectedCard]);

  // Check if user has completed all steps
  useEffect(() => {
    const storedUserId = formStorage.getUserId();
    if (!storedUserId) {
      router.push('/step-1');
      return;
    }
    setUserId(storedUserId);

    // Load user session and dashboard
    const loadDashboard = async () => {
      try {
        const session = await userApi.getSession(storedUserId);
        setUserSession(session);

        // Generate dynamic cards based on user session
        let generatedCards: DashboardCard[] = [];
        if (session) {
          try {
            // Ensure arrays are properly parsed
            const healthGoals = Array.isArray(session.health_goals) ? session.health_goals : (session.health_goals ? (session.health_goals as string).split(',') : []);
            const mainInterests = Array.isArray((session as any).main_interests) ? (session as any).main_interests : ((session as any).main_interests ? ((session as any).main_interests as string).split(',') : []);
            const mainGoals = Array.isArray(session.main_goal) ? session.main_goal : (session.main_goal ? (session.main_goal as string).split(',') : []);
            
            console.log('Dashboard - Parsed data:', {
              condition: session.condition_selected,
              healthGoals,
              mainInterests,
              mainGoals,
              knowledgeLevel: (session as any).knowledge_level,
              learningStyle: (session as any).learning_style
            });
            
            generatedCards = generateDashboardCards(
              session.condition_selected,
              healthGoals,
              (session as any).knowledge_level || 'new',
              mainInterests,
              mainGoals,
              (session as any).learning_style
            );
            console.log('Dashboard - Generated cards:', generatedCards.length);
            setDynamicCards(generatedCards);
          } catch (cardError) {
            console.error('Error generating dynamic cards:', cardError);
            // Set empty array as fallback
            generatedCards = [];
            setDynamicCards([]);
          }
        }

        // Smart caching: Try to load existing content first
        // Step 4 should have already generated the content when "Create Dashboard" was clicked
        console.log('Session exists, loading dashboard content...');
        console.log('Generated cards count:', generatedCards?.length || 0);
        
        // First, try to load existing content from cache/database
        try {
          const existingContent = await aiApi.getDashboard(storedUserId);
          if (existingContent && existingContent.dashboard && Object.keys(existingContent.dashboard).length > 0) {
            console.log('✅ CACHE HIT: Content already exists, loading from cache');
            console.log('Cached content keys:', Object.keys(existingContent.dashboard));
            setDashboardContent(existingContent.dashboard);
            setLoadingSession(false);
            return; // Skip generation, use cached content
          } else {
            console.log('⚠️ CACHE MISS: No existing content found');
            console.log('⚠️ This should not happen - Step 4 should have generated content');
            console.log('⚠️ Will attempt to generate now as fallback...');
          }
        } catch (cacheError) {
          console.log('Cache check failed, will generate new content:', cacheError);
        }
        
        // Fallback: Generate content if not cached (should rarely happen)
        if (session && generatedCards && generatedCards.length > 0) {
          setGeneratingContent(true);
          try {
            console.log('=== FRONTEND: Starting AI dashboard generation ===');
            console.log('User ID:', storedUserId);
            console.log('Dynamic cards being sent:', generatedCards?.length || 0);
            if (generatedCards && generatedCards.length > 0) {
              console.log('Dynamic cards details:', generatedCards.map(c => ({ id: c.id, contentKey: c.contentKey, title: c.title })));
            } else {
              console.warn('⚠️ WARNING: No dynamic cards generated, backend will use legacy content');
            }
            
            const response = await aiApi.generateDashboard(storedUserId, generatedCards);
            console.log('=== FRONTEND: AI generation response received ===');
            console.log('Response success:', response.success);
            console.log('Response dashboard keys:', Object.keys(response.dashboard || {}));
            
            if (response.success && response.dashboard) {
              console.log('Dashboard content received:', response.dashboard);
              setDashboardContent(response.dashboard);
              formStorage.saveCurrentStep(5);
            } else {
              throw new Error('Failed to generate dashboard content');
            }
          } catch (err) {
            console.error('AI generation error:', err);
            const errorMessage = handleApiError(err);
            errorUtils.log('DashboardComponent generateDashboardContent', err);
            setError(errorMessage);
            
            // Fallback content if AI generation fails
            const fallbackContent: DashboardContent = {
              diagnosis_basics: `Learn about ${session?.condition_selected || 'your condition'} and how it affects your body. Understanding your condition is the first step toward better management.`,
              nutrition_carbs: `Proper nutrition plays a crucial role in managing ${session?.condition_selected || 'your condition'}. Focus on balanced meals and work with your healthcare team for personalized guidance.`,
              workout: `Regular physical activity can help manage ${session?.condition_selected || 'your condition'}. Start slowly and consult your doctor before beginning any exercise program.`,
              daily_plan: `Create a daily routine that includes medication reminders, health monitoring, and lifestyle habits that support your ${session?.condition_selected || 'condition'} management.`
            };
            console.log('Using fallback content:', fallbackContent);
            setDashboardContent(fallbackContent);
          } finally {
            setGeneratingContent(false);
          }
        } else {
          console.log('⚠️ No session or no generated cards, cannot generate content');
          setError('Unable to load dashboard. Please complete the assessment first.');
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        errorUtils.log('DashboardComponent loadDashboard', err);
        // Don't redirect immediately - user might want to retry
        setError('Failed to load dashboard. Please try refreshing the page.');
      } finally {
        setLoadingSession(false);
      }
    };

    loadDashboard();
  }, [router]);


  const handleCardClick = (cardId: string) => {
    if (!dashboardContent) return;

    // Only work with dynamic cards - no fallback to legacy cards
    const card = dynamicCards.find(c => c.id === cardId);
    if (!card) return;

    // Get content using contentKey for dynamic cards
    const content = (dashboardContent as any)[card.contentKey] || '';
    setSelectedCard({
      title: card.title,
      content,
      icon: card.icon
    });
  };

  const handleVoiceRead = async (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    if (!userId || !dashboardContent) return;

    try {
      // If clicking the currently playing card
      if (playingCardId === cardId) {
        if (dashboardAudioManager.getIsPlaying()) {
          // Pause if currently playing
          dashboardAudioManager.pause();
          setIsPaused(true);
          setIsPlaying(false);
          return;
        } else if (isPaused) {
          // Resume if currently paused
          dashboardAudioManager.resume();
          setIsPaused(false);
          setIsPlaying(true);
          return;
        }
      }
      
      // If a different card, stop current audio and play new
      dashboardAudioManager.stop();
      setIsPlaying(false);
      setIsPaused(false);
      setIsGenerating(true);
      setPlayingCardId(cardId);
      
      // Play card summary using new dashboard API
      const summaryResponse = await voiceApi.generateDashboardCardAudio(userId, cardId);
      if (summaryResponse.audio_url) {
        setIsGenerating(false);
        await dashboardAudioManager.play(summaryResponse.audio_url);
        setIsPlaying(true);
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error playing card summary:', error);
      setError('Failed to play card summary');
      setIsPlaying(false);
      setIsPaused(false);
      setIsGenerating(false);
      setPlayingCardId(null);
    }
  };

  const handleStopAudio = () => {
    dashboardAudioManager.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setPlayingCardId(null);
  };

  const handleStartOver = () => {
    formStorage.clearAll();
    router.push('/step-1');
  };

  const handleRegenerateContent = async () => {
    if (!userId || dynamicCards.length === 0 || generatingContent) return;
    
    setGeneratingContent(true);
    try {
      console.log('=== MANUAL REGENERATION: Starting AI dashboard generation ===');
      console.log('User ID:', userId);
      console.log('Dynamic cards:', dynamicCards.length);
      
      const response = await aiApi.generateDashboard(userId, dynamicCards);
      
      if (response.success && response.dashboard) {
        console.log('✅ Regeneration successful');
        setDashboardContent(response.dashboard);
      } else {
        throw new Error('Failed to regenerate dashboard content');
      }
    } catch (error) {
      console.error('❌ Regeneration failed:', error);
      setError('Failed to regenerate content. Please try again.');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!dashboardContent || !userSession) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-Based Patient Education Report', margin, yPosition);
      yPosition += 15;

      // User Info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Patient: ${userSession.full_name}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Condition: ${userSession.condition_selected}`, margin, yPosition);
      yPosition += 8;
      if (userSession.main_goal) {
        pdf.text(`Main Goal: ${userSession.main_goal}`, margin, yPosition);
        yPosition += 8;
      }
      yPosition += 10;

      // Cards content - Use the current dynamic cards from dashboard
      const cards = dynamicCards.map(card => {
        // Get content from dashboardContent using the card's contentKey
        let content = '';
        if (dashboardContent && card.contentKey) {
          content = dashboardContent[card.contentKey] || '';
        }
        
        return {
          title: card.title,
          content: content,
          icon: card.icon || ''
        };
      });

      for (const card of cards) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        // Card title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${card.title}`, margin, yPosition);
        yPosition += 12;

        // Card content
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Use the content from the card (already mapped from dashboardContent)
        let cardContent = card.content || '';
        
        // If no content is available, show a placeholder
        if (!cardContent) {
          cardContent = 'Content is being generated. Please wait a moment and try downloading again.';
        }
        
        // Clean and split content into lines
        const cleanContent = cardContent
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** formatting for cleaner text
          .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters that might cause issues
          .trim();
        
        const lines = pdf.splitTextToSize(cleanContent, pageWidth - 2 * margin);
        
        for (const line of lines) {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Handle bold sections by looking for the original ** markers in content
          if (cardContent && cardContent.includes('**') && line.length > 0) {
            // Simple approach: if the line corresponds to a bold section, make it bold
            const originalParts = cardContent.split(/\*\*(.*?)\*\*/g);
            let isBoldSection = false;
            
            for (let i = 0; i < originalParts.length; i++) {
              if (i % 2 === 1 && originalParts[i].includes(line.replace(/[^\x00-\x7F]/g, '').substring(0, 20))) {
                isBoldSection = true;
                break;
              }
            }
            
            if (isBoldSection) {
              pdf.setFont('helvetica', 'bold');
            } else {
              pdf.setFont('helvetica', 'normal');
            }
          }
          
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        }
        yPosition += 10;
      }

      // Footer
      const currentDate = new Date().toLocaleDateString();
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated on ${currentDate} by AI-Based Patient Education Platform`, margin, pageHeight - 10);

      // Save the PDF
      const cleanName = (userSession.full_name || 'patient').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanCondition = userSession.condition_selected.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${cleanName}_${cleanCondition}_Education_Report.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Sorry, there was an error generating the PDF. Please try again.');
    }
  };

  if (loadingSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return null;
  }

  const firstName = format.getFirstName(userSession.full_name || 'there');
  const condition = userSession.condition_selected;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Patient Education Dashboard
            </h1>
            <p className="text-gray-600">
              AI-powered personalized health education for {condition}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Patient</p>
              <p className="font-semibold text-gray-900">{firstName}</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors">
                <span className="text-blue-600 font-bold text-lg">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Toggle Button - positioned under profile */}
              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center justify-center gap-1"
                title={showRightPanel ? "Hide panel" : "Show panel"}
              >
                {showRightPanel ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Hide
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Show
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showRightPanel ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} transition-all duration-300`}>
        {/* Main Content Area - Left Side */}
        <div className={`${showRightPanel ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-6 ${!showRightPanel ? 'w-full' : ''}`}>
          {/* Education Cards Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📚</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Educational Content</h2>
              </div>
              <p className="text-gray-600 mt-2">
                Personalized educational materials based on your condition and goals
              </p>
            </div>
            
            <div className="p-6">
              {dashboardContent && dynamicCards.length > 0 ? (
                <div className="space-y-6">
                  {dynamicCards.map((card: DashboardCard) => {
                    let content = '';
                    
                    console.log(`Processing card: ${card.title}, ID: ${card.id}, ContentKey: ${card.contentKey}`);
                    console.log(`Dashboard content keys available:`, Object.keys(dashboardContent || {}));
                    
                    // For dynamic cards, use the contentKey to get content
                    if (card.contentKey) {
                      content = (dashboardContent as any)[card.contentKey] || '';
                      console.log(`Card ${card.title} (${card.contentKey}):`, content ? `Has content (${content.length} chars)` : 'No content');
                      if (!content) {
                        console.log(`ERROR: No content found for key '${card.contentKey}' in dashboard content`);
                        console.log('All available keys:', Object.keys(dashboardContent || {}));
                        console.log('Full dashboard content:', dashboardContent);
                      }
                    } else {
                      // Legacy card handling (should not happen with dynamic cards)
                      console.log(`Warning: Card ${card.title} has no contentKey property`);
                      content = '';
                    }

                    const isCurrentlyPlaying = playingCardId === card.id;
                    const isCardPlaying = isCurrentlyPlaying && isPlaying;
                    const isCardPaused = isCurrentlyPlaying && isPaused;
                    const isCardGenerating = isCurrentlyPlaying && isGenerating;

                    return (
                      <div
                        key={card.id}
                        className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer bg-gray-50 hover:bg-white hover:scale-[1.01] relative"
                        onClick={() => handleCardClick(card.id)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-14 h-14 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-2xl">
                            {card.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                            <p className="text-base text-gray-600 mb-4">{card.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-blue-600 font-medium">
                                Click to explore →
                              </div>
                              {isCardGenerating && (
                                <div className="text-sm text-blue-600 font-medium">
                                  Generating audio...
                                </div>
                              )}
                              {isCardPlaying && (
                                <div className="text-sm text-green-600 font-medium">
                                  Playing...
                                </div>
                              )}
                              {isCardPaused && (
                                <div className="text-sm text-amber-600 font-medium">
                                  Paused
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : dynamicCards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {generatingContent ? 'Generating Your Dashboard' : 'Loading Dashboard'}
                  </h3>
                  <p className="text-gray-500">
                    {generatingContent 
                      ? 'Please wait while we create your personalized educational content... This may take 20-30 seconds.'
                      : 'Checking for existing content...'
                    }
                  </p>
                  {generatingContent && (
                    <div className="mt-4 flex justify-center">
                      <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
                  <p className="text-gray-500">Please complete the previous steps to generate your personalized dashboard.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {dashboardContent && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Actions</h2>
              
              {/* Primary Action Buttons */}
              <div className="flex justify-center gap-3 mb-6 flex-wrap">
                
                <Button
                  onClick={handleDownloadPDF}
                  disabled={!dashboardContent}
                  className="bg-green-600 hover:bg-green-700 text-white cursor-pointer transition-all px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Report
                </Button>
                
                <Button
                  onClick={handleRegenerateContent}
                  disabled={generatingContent || dynamicCards.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingContent ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate Content
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleStartOver}
                  className="bg-white hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-700 cursor-pointer transition-all px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Patient Summary Sidebar - Right Side - Conditionally Rendered */}
        {showRightPanel && (
        <div className="space-y-6">
          {/* Patient Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">👤</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Patient Summary</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Name</h4>
                <p className="text-gray-600">{userSession.full_name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Age & Gender</h4>
                <p className="text-gray-600">{userSession.age} years, {userSession.gender}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Primary Condition</h4>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {condition}
                </div>
              </div>
              
              {userSession.main_goal && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Health Goal</h4>
                  <p className="text-gray-600 text-sm">{userSession.main_goal}</p>
                </div>
              )}
              
              {userSession.main_question && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Specific Concerns</h4>
                  <p className="text-gray-600 text-sm">{userSession.main_question}</p>
                </div>
              )}
            </div>
          </div>

          {/* Education Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Education Features</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">AI-powered content generation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Personalized recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Evidence-based information</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Interactive learning</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Progress tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">PDF report generation</span>
              </div>
            </div>
          </div>

          {/* Progress Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Completion Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Assessment Complete</span>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Content Generated</span>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Dashboard Ready</span>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Overall Progress</span>
                  <span className="font-bold text-green-600">100%</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Audio Control Bar */}
      {isPlaying && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span className="text-sm text-gray-700">
                Playing: {dynamicCards.find(c => c.id === playingCardId)?.title}
              </span>
            </div>
            <button
              onClick={handleStopAudio}
              className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              title="Stop audio"
            >
              <VolumeX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">!</span>
            </div>
            <p className="text-sm text-red-700">
              {error}
              {dashboardContent && " We've provided basic information to get you started."}
            </p>
          </div>
        </div>
      )}

      {/* Content Modal */}
      <ContentModal
        isOpen={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        title={selectedCard?.title || ''}
        content={selectedCard?.content || ''}
        icon={selectedCard?.icon || ''}
        highlightedText={highlightedText}
        isHighlighting={isHighlighting && !!selectedCard && playingCardId === dynamicCards.find(c => c.title === selectedCard.title)?.id}
        isPlaying={isPlaying && !!selectedCard && playingCardId === dynamicCards.find(c => c.title === selectedCard.title)?.id}
        isPaused={isPaused && !!selectedCard && playingCardId === dynamicCards.find(c => c.title === selectedCard.title)?.id}
        isGenerating={isGenerating && !!selectedCard && playingCardId === dynamicCards.find(c => c.title === selectedCard.title)?.id}
        audioDuration={audioDuration}
        audioCurrentTime={audioCurrentTime}
        onPlayPause={() => {
          if (selectedCard) {
            // Find the card ID that matches the selected card title
            const card = dynamicCards.find(c => c.title === selectedCard.title);
            if (card) {
              handleVoiceRead(card.id, { stopPropagation: () => {} } as any);
            }
          }
        }}
        onStop={() => {
          dashboardAudioManager.stop();
          setIsPlaying(false);
          setIsPaused(false);
          setPlayingCardId(null);
        }}
      />

      {/* Dashboard Voice Agent */}
      <DashboardVoiceAgent 
        userId={userSession?.user_id || userSession?.id || 1}
        dashboardCards={dynamicCards}
        userSession={userSession}
        selectedCard={selectedCard}
        dashboardContent={dashboardContent}
      />
    </div>
  );
};