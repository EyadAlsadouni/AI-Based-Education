'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { aiApi, userApi, handleApiError } from '../../lib/api';
import { formStorage, format, error as errorUtils } from '../../lib/utils';
import { DASHBOARD_CARDS } from '../../lib/constants';
import { DashboardContent, UserSession } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DashboardCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: string;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  content,
  onClick
}) => {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          <div className="text-sm text-blue-600 font-medium">
            Click to explore →
          </div>
        </div>
      </div>
    </div>
  );
};

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
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">{icon}</span>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="prose prose-lg max-w-none">
            {content.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null;
              
              // Check if paragraph contains **text** pattern for bold
              const parts = paragraph.split(/\*\*(.*?)\*\*/g);
              
              return (
                <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                  {parts.map((part, partIndex) => {
                    if (partIndex % 2 === 1) {
                      return <strong key={partIndex} className="font-bold text-gray-900">{part}</strong>;
                    }
                    
                    // Check for URLs in the text and make them clickable
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const textParts = part.split(urlRegex);
                    
                    return textParts.map((textPart, textIndex) => {
                      if (urlRegex.test(textPart)) {
                        return (
                          <a 
                            key={textIndex} 
                            href={textPart} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {textPart}
                          </a>
                        );
                      }
                      return textPart;
                    });
                  })}
                </p>
              );
            })}
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

        // Always try to load existing dashboard content
        try {
          const dashboardData = await aiApi.getDashboard(storedUserId);
          if (dashboardData.success && dashboardData.dashboard) {
            setDashboardContent(dashboardData.dashboard);
          }
        } catch (dashboardErr) {
          // Dashboard doesn't exist yet, will generate new one
          console.log('No existing dashboard found, will generate new one');
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

  // Generate dashboard content only if truly missing
  useEffect(() => {
    if (!loadingSession && userSession && !dashboardContent && userId) {
      console.log('Dashboard content missing, generating as fallback');
      generateDashboardContent();
    }
  }, [loadingSession, userSession, dashboardContent, userId]);

  const generateDashboardContent = async () => {
    if (!userId) return;

    setGeneratingContent(true);
    setError('');

    try {
      console.log('Starting AI dashboard generation for user:', userId);
      const response = await aiApi.generateDashboard(userId);
      console.log('AI generation response:', response);
      
      if (response.success && response.dashboard) {
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

    const card = DASHBOARD_CARDS.find(c => c.id === cardId);
    if (!card) return;

    let content = '';
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

    setSelectedCard({
      title: card.title,
      content,
      icon: card.icon
    });
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
      const cleanName = userSession.full_name.replace(/[^a-zA-Z0-9]/g, '_');
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI-Based Patient Education
        </h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-green-900 mb-2">
            Welcome to Your Dashboard, {firstName}!
          </h2>
          <p className="text-green-700">
            Your personalized {condition} education center is ready.
          </p>
        </div>
      </div>

      {/* User Goal Display */}
      {userSession.main_goal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-1">Your Goal:</h3>
          <p className="text-blue-700">{userSession.main_goal}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            {error}
            {dashboardContent && " We've provided basic information to get you started."}
          </p>
        </div>
      )}

      {/* Dashboard Cards */}
      {dashboardContent ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {DASHBOARD_CARDS.map((card) => {
              let content = '';
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

              return (
                <DashboardCard
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  content={content}
                  onClick={() => handleCardClick(card.id)}
                />
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={generateDashboardContent}
              loading={generatingContent}
              disabled={generatingContent}
              variant="outline"
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Refresh Content
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={!dashboardContent}
              className="bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors"
            >
              Download PDF Report
            </Button>
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Start Over
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-700">
              Dashboard content is being prepared. Please refresh the page or click 'Refresh Content' below.
            </p>
            <Button
              onClick={generateDashboardContent}
              loading={generatingContent}
              disabled={generatingContent}
              className="mt-4"
            >
              Generate Content
            </Button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-8 text-center">
        <div className="flex justify-center space-x-2 mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className="w-3 h-3 rounded-full bg-green-600"
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">Complete! Dashboard Ready</p>
      </div>

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