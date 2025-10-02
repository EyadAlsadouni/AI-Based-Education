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





interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  icon: string;
}

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  icon
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Modal Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
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
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          <div className="prose prose-gray max-w-none">
            {content.split('\n').map((paragraph, index) => {
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
            })}
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
  const [dashboardAudioManager] = useState(() => new AudioManager());

  // Audio event handlers for voice reading
  useEffect(() => {
    const handleStart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      console.log('[Dashboard AudioManager] start');
    };
    const handleEnd = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setPlayingCardId(null);
      console.log('[Dashboard AudioManager] end');
    };
    const handleError = (err: any) => {
      setIsPlaying(false);
      setIsPaused(false);
      setPlayingCardId(null);
      setError('Failed to play audio');
      console.log('[Dashboard AudioManager] error', err);
    };
    
    dashboardAudioManager.on('start', handleStart);
    dashboardAudioManager.on('end', handleEnd);
    dashboardAudioManager.on('error', handleError);
    
    return () => {
      dashboardAudioManager.off('start', handleStart);
      dashboardAudioManager.off('end', handleEnd);
      dashboardAudioManager.off('error', handleError);
    };
  }, [dashboardAudioManager]);

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
        let generatedCards = [];
        if (session) {
          try {
            // Ensure arrays are properly parsed
            const healthGoals = Array.isArray(session.health_goals) ? session.health_goals : (session.health_goals ? session.health_goals.split(',') : []);
            const mainInterests = Array.isArray(session.main_interests) ? session.main_interests : (session.main_interests ? session.main_interests.split(',') : []);
            const mainGoals = Array.isArray(session.main_goal) ? session.main_goal : (session.main_goal ? session.main_goal.split(',') : []);
            
            console.log('Dashboard - Parsed data:', {
              condition: session.condition_selected,
              healthGoals,
              mainInterests,
              mainGoals,
              knowledgeLevel: session.knowledge_level,
              learningStyle: session.learning_style
            });
            
            generatedCards = generateDashboardCards(
              session.condition_selected,
              healthGoals,
              session.knowledge_level || 'new',
              mainInterests,
              mainGoals,
              session.learning_style
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

        // Only try to load existing dashboard content if no dynamic cards are present
        if (generatedCards && generatedCards.length > 0) {
          console.log('Dynamic cards present, will generate new content instead of loading existing');
          // Generate content immediately with the cards we just created
          try {
            console.log('=== FRONTEND: Starting AI dashboard generation ===');
            console.log('User ID:', storedUserId);
            console.log('Dynamic cards being sent:', generatedCards.length);
            console.log('Dynamic cards details:', generatedCards.map(c => ({ id: c.id, contentKey: c.contentKey, title: c.title })));
            
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
          }
        } else {
          try {
            const dashboardData = await aiApi.getDashboard(storedUserId);
            if (dashboardData.success && dashboardData.dashboard) {
              setDashboardContent(dashboardData.dashboard);
            }
          } catch (dashboardErr) {
            // Dashboard doesn't exist yet, will generate new one
            console.log('No existing dashboard found, will generate new one');
          }
        }
      } catch (err) {
        errorUtils.log('DashboardComponent loadDashboard', err);
        router.push('/step-1');
      } finally {
        setLoadingSession(false);
      }
    };

    loadDashboard();
  }, [router]);

  // Generate dashboard content only if truly missing (fallback for legacy cards)
  useEffect(() => {
    if (!loadingSession && userSession && !dashboardContent && userId && dynamicCards.length === 0) {
      console.log('Dashboard content missing, generating as fallback');
      generateDashboardContent();
    }
  }, [loadingSession, userSession, dashboardContent, userId, dynamicCards.length]);

  const generateDashboardContent = async () => {
    if (!userId) return;

    setGeneratingContent(true);
    setError('');

    try {
      console.log('=== FRONTEND: Starting AI dashboard generation (fallback) ===');
      console.log('User ID:', userId);
      console.log('Dynamic cards being sent:', dynamicCards.length);
      
      const response = await aiApi.generateDashboard(userId, dynamicCards);
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
        diagnosis_basics: `Learn about ${userSession?.condition_selected || 'your condition'} and how it affects your body. Understanding your condition is the first step toward better management.`,
        nutrition_carbs: `Proper nutrition plays a crucial role in managing ${userSession?.condition_selected || 'your condition'}. Focus on balanced meals and work with your healthcare team for personalized guidance.`,
        workout: `Regular physical activity can help manage ${userSession?.condition_selected || 'your condition'}. Start slowly and consult your doctor before beginning any exercise program.`,
        daily_plan: `Create a daily routine that includes medication reminders, health monitoring, and lifestyle habits that support your ${userSession?.condition_selected || 'condition'} management.`
      };
      console.log('Using fallback content:', fallbackContent);
      setDashboardContent(fallbackContent);
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (!dashboardContent) return;

    // Try to find card in dynamic cards first
    let card = dynamicCards.find(c => c.id === cardId);
    if (!card) {
      // Fallback to legacy cards
      card = DASHBOARD_CARDS.find(c => c.id === cardId);
    }
    if (!card) return;

    let content = '';
    
    // For dynamic cards, use the contentKey to get content
    if ('contentKey' in card) {
      content = (dashboardContent as any)[card.contentKey] || '';
    } else {
      // Legacy card handling
      switch (cardId) {
        case 'diagnosis':
          content = dashboardContent.diagnosis_basics;
          break;
        case 'nutrition':
          content = dashboardContent.nutrition_carbs;
          break;
        case 'workout':
          content = dashboardContent.workout;
          break;
        case 'daily_plan':
          content = dashboardContent.daily_plan;
          break;
      }
    }

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

      // Cards content
      const cards = [
        { title: 'Diagnosis Basics', content: dashboardContent.diagnosis_basics, icon: '' },
        { title: 'Nutrition and Carbs', content: dashboardContent.nutrition_carbs, icon: '' },
        { title: 'Workout', content: dashboardContent.workout, icon: '' },
        { title: 'Plan Your Day', content: dashboardContent.daily_plan, icon: '' }
      ];

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
        
        // Clean and split content into lines
        const cleanContent = card.content
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
          if (card.content.includes('**') && line.length > 0) {
            // Simple approach: if the line corresponds to a bold section, make it bold
            const originalParts = card.content.split(/\*\*(.*?)\*\*/g);
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
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area - Left Side */}
        <div className="lg:col-span-2 space-y-6">
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
              {dashboardContent ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(dynamicCards.length > 0 ? dynamicCards : DASHBOARD_CARDS).map((card) => {
                    let content = '';
                    
                    // For dynamic cards, use the contentKey to get content
                    if ('contentKey' in card) {
                      content = (dashboardContent as any)[card.contentKey] || '';
                      console.log(`Card ${card.title} (${card.contentKey}):`, content ? `Has content (${content.length} chars)` : 'No content');
                      if (!content) {
                        console.log('Available content keys:', Object.keys(dashboardContent || {}));
                      }
                    } else {
                      // Legacy card handling
                      switch (card.id) {
                        case 'diagnosis':
                          content = dashboardContent.diagnosis_basics;
                          break;
                        case 'nutrition':
                          content = dashboardContent.nutrition_carbs;
                          break;
                        case 'workout':
                          content = dashboardContent.workout;
                          break;
                        case 'daily_plan':
                          content = dashboardContent.daily_plan;
                          break;
                      }
                    }

                    const isCurrentlyPlaying = playingCardId === card.id;
                    const isCardPlaying = isCurrentlyPlaying && isPlaying;
                    const isCardPaused = isCurrentlyPlaying && isPaused;
                    const isCardGenerating = isCurrentlyPlaying && isGenerating;

                    return (
                      <div
                        key={card.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-gray-50 hover:bg-white hover:scale-[1.02] relative"
                        onClick={() => handleCardClick(card.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-lg">
                            {card.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-blue-600 font-medium">
                                Click to explore →
                              </div>
                              {isCardGenerating && (
                                <div className="text-xs text-blue-600 font-medium">
                                  Generating audio...
                                </div>
                              )}
                              {isCardPlaying && (
                                <div className="text-xs text-green-600 font-medium">
                                  Playing...
                                </div>
                              )}
                              {isCardPaused && (
                                <div className="text-xs text-amber-600 font-medium">
                                  Paused
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Microphone Icon */}
                        <button
                          onClick={(e) => handleVoiceRead(card.id, e)}
                          disabled={isCardGenerating}
                          className={`absolute top-3 right-3 p-2 rounded-full transition-all hover:scale-110 cursor-pointer ${
                            isCardGenerating
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isCardPlaying
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : isCardPaused
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          }`}
                          title={isCardGenerating ? 'Generating audio...' : isCardPlaying ? 'Pause audio' : isCardPaused ? 'Resume audio' : 'Play audio'}
                        >
                          {isCardGenerating ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                          ) : isCardPlaying ? (
                            <VolumeX className="h-4 w-4" />
                          ) : isCardPaused ? (
                            <Volume2 className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-yellow-600 text-2xl">⚡</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Generating Content</h3>
                  <p className="text-gray-600 mb-4">
                    AI is preparing your personalized educational materials
                  </p>
                  <Button
                    onClick={generateDashboardContent}
                    loading={generatingContent}
                    disabled={generatingContent}
                    className="bg-blue-600 hover:bg-blue-700 cursor-pointer hover:scale-105 transition-transform"
                  >
                    Generate Content
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {dashboardContent && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Actions</h2>
              
              {/* Primary Action Buttons */}
              <div className="flex justify-center gap-3 mb-6">
                <Button
                  onClick={generateDashboardContent}
                  loading={generatingContent}
                  disabled={generatingContent}
                  className="bg-white hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-700 cursor-pointer transition-all px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Content
                </Button>
                
                <Button
                  onClick={handleDownloadPDF}
                  disabled={!dashboardContent}
                  className="bg-green-600 hover:bg-green-700 text-white cursor-pointer transition-all px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Report
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
              
              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              {/* Voice Coach Button */}
              <div className="text-center">
                <Button
                  onClick={() => router.push('/voice-coach')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white cursor-pointer transition-all transform hover:scale-105 px-8 py-3 rounded-lg inline-flex items-center gap-2.5 font-semibold text-base shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Talk to Voice Coach
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Interact with your AI health assistant using voice
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Patient Summary Sidebar - Right Side */}
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
      </div>

      {/* Audio Control Bar */}
      {isPlaying && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">
                Playing: {(dynamicCards.length > 0 ? dynamicCards : DASHBOARD_CARDS).find(c => c.id === playingCardId)?.title}
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
      />
    </div>
  );
};