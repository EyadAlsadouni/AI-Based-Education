'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Select, Textarea } from '../ui/FormElements';
import { conditionsApi, userApi, aiApi, handleApiError } from '../../lib/api';
import { formStorage, format, error as errorUtils } from '../../lib/utils';
import { DEFAULT_CONDITION_GOALS, generateDynamicGoals, generateDashboardCards } from '../../lib/constants';
import { Step4FormData, UserSession } from '../../types';

export const Step4Component: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [generatingDashboard, setGeneratingDashboard] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Step4FormData, string>>>({});
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [formData, setFormData] = useState<Step4FormData>({
    main_goal: [],
    main_question: '',
    learning_style: undefined
  });

  // Check if user has completed previous steps
  useEffect(() => {
    const storedUserId = formStorage.getUserId();
    if (!storedUserId) {
      router.push('/step-1');
      return;
    }
    setUserId(storedUserId);

    // Load user session
    const loadSession = async () => {
      try {
        const session = await userApi.getSession(storedUserId);
        setUserSession(session);
        
        // Load saved form data
        const savedData = formStorage.getFormData<Partial<Step4FormData>>();
        if (savedData) {
          setFormData(prev => ({ ...prev, ...savedData }));
          // Handle both old string format and new array format
          if (savedData.main_goal) {
            if (typeof savedData.main_goal === 'string') {
              // Convert old string format to array
              const goalArray = [savedData.main_goal];
              setFormData(prev => ({ ...prev, main_goal: goalArray }));
              if (!DEFAULT_CONDITION_GOALS[session.condition_selected.toLowerCase()]?.includes(savedData.main_goal)) {
                setShowCustomGoal(true);
                setCustomGoal(savedData.main_goal);
              }
            } else if (Array.isArray(savedData.main_goal)) {
              // Check if any goals are custom
              const customGoals = savedData.main_goal.filter(goal => !DEFAULT_CONDITION_GOALS[session.condition_selected.toLowerCase()]?.includes(goal));
              if (customGoals.length > 0) {
                setShowCustomGoal(true);
                setCustomGoal(customGoals[0]); // Show first custom goal
              }
            }
          }
        }
      } catch (err) {
        errorUtils.log('Step4Component loadSession', err);
        router.push('/step-2');
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [router]);

  // Load dynamic goals based on user's previous choices
  useEffect(() => {
    if (!userSession?.condition_selected) return;

    const loadGoals = () => {
      setLoadingGoals(true);
      try {
        
        // Get data from userSession first, then fallback to formStorage
        const healthGoal = userSession.health_goals?.[0] || 'Education about the condition (e.g., Diabetes, Heart Health)';
        const knowledgeLevel = userSession.knowledge_level || 'new';
        const mainInterests = userSession.main_interests || [];
        
        
        const dynamicGoals = generateDynamicGoals(
          healthGoal,
          userSession.condition_selected,
          knowledgeLevel,
          mainInterests
        );
        
        setAvailableGoals(dynamicGoals);
      } catch (err) {
        errorUtils.log('Step4Component loadGoals', err);
        console.error('Step4 - Error generating goals:', err);
        // Fallback to basic goals
        setAvailableGoals(['Learn about my condition', 'Manage my symptoms', 'Improve my health', 'Other...']);
      } finally {
        setLoadingGoals(false);
      }
    };

    loadGoals();
  }, [userSession]);

  // Save form data whenever it changes
  useEffect(() => {
    formStorage.saveFormData(formData);
  }, [formData]);

  const updateFormData = (field: keyof Step4FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user updates field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Real-time validation for main question
    if (field === 'main_question' && value && value.trim().length > 0) {
      if (containsMedicalAdvice(value)) {
        setErrors(prev => ({ 
          ...prev, 
          main_question: 'Please ask educational questions about your condition, not medical advice. Avoid questions about medications, treatments, or symptoms that require a doctor.' 
        }));
      } else {
        setErrors(prev => ({ ...prev, main_question: undefined }));
      }
    }
  };

  const handleGoalChange = (selectedGoal: string, checked: boolean) => {
    if (selectedGoal === 'Other...') {
      if (checked) {
        setShowCustomGoal(true);
        setCustomGoal('');
      } else {
        setShowCustomGoal(false);
        setCustomGoal('');
        updateFormData('main_goal', formData.main_goal.filter(g => g !== 'Other...'));
      }
    } else {
      const newGoals = checked 
        ? [...formData.main_goal, selectedGoal]
        : formData.main_goal.filter(g => g !== selectedGoal);
      updateFormData('main_goal', newGoals);
    }
  };

  const handleCustomGoalChange = (value: string) => {
    setCustomGoal(value);
    if (showCustomGoal) {
      // Replace any existing "Other..." with the custom goal
      const otherGoals = formData.main_goal.filter(g => g !== 'Other...');
      updateFormData('main_goal', [...otherGoals, value]);
    }
  };

  const handleClearGoals = () => {
    updateFormData('main_goal', []);
    setShowCustomGoal(false);
    setCustomGoal('');
  };

  // Function to check if question contains medical advice requests
  const containsMedicalAdvice = (question: string): boolean => {
    const medicalAdviceKeywords = [
      'medication', 'medicine', 'drug', 'prescription', 'dosage', 'dose',
      'should i take', 'can i take', 'is it safe', 'side effects',
      'treatment', 'therapy', 'cure', 'heal', 'fix', 'solve',
      'diagnose', 'diagnosis', 'symptoms', 'signs', 'test results',
      'emergency', 'urgent', 'serious', 'dangerous', 'harmful',
      'doctor', 'physician', 'specialist', 'medical advice',
      'what should i do', 'what can i do', 'how to treat',
      'is this normal', 'is this bad', 'should i worry'
    ];
    
    const lowerQuestion = question.toLowerCase();
    return medicalAdviceKeywords.some(keyword => lowerQuestion.includes(keyword));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step4FormData, string>> = {};

    // Validate main goal
    if (formData.main_goal.length === 0) {
      newErrors.main_goal = 'Please select at least one goal';
    }

    // Validate main question for medical advice
    if (formData.main_question && formData.main_question.trim().length > 0) {
      if (containsMedicalAdvice(formData.main_question)) {
        newErrors.main_question = 'Please ask educational questions about your condition, not medical advice. Avoid questions about medications, treatments, or symptoms that require a doctor.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId || !userSession) {
      return;
    }

    setLoading(true);

    try {
      // Update user session with goals, questions, and learning style
      await userApi.createSession(userId, {
        condition_selected: userSession.condition_selected,
        knowledge_level: userSession.knowledge_level,
        main_interests: userSession.main_interests,
        biggest_challenge: userSession.biggest_challenge,
        ...formData
      });

      // Mark step as complete
      formStorage.saveCurrentStep(5);
      
      // Start dashboard generation with overlay
      setLoading(false);
      setGeneratingDashboard(true);
      
      // Generate dynamic cards based on user session
      console.log('[Step 4] Generating dynamic cards for dashboard...');
      const sessionData = await userApi.getSession(userId);
      const healthGoals = Array.isArray(sessionData.health_goals) 
        ? sessionData.health_goals 
        : (sessionData.health_goals ? (sessionData.health_goals as string).split(',') : []);
      const mainInterests = Array.isArray((sessionData as any).main_interests) 
        ? (sessionData as any).main_interests 
        : ((sessionData as any).main_interests ? ((sessionData as any).main_interests as string).split(',') : []);
      const mainGoals = Array.isArray(formData.main_goal) 
        ? formData.main_goal 
        : (formData.main_goal ? (formData.main_goal as string).split(',') : []);
      
      const dynamicCards = generateDashboardCards(
        sessionData.condition_selected,
        healthGoals,
        (sessionData as any).knowledge_level || 'new',
        mainInterests,
        mainGoals,
        formData.learning_style,
        formData.main_question
      );
      
      console.log('[Step 4] Generated', dynamicCards.length, 'dynamic cards');
      console.log('[Step 4] Card titles:', dynamicCards.map(c => c.title).join(', '));
      
      // Generate AI dashboard content WITH dynamic cards
      await aiApi.generateDashboard(userId, dynamicCards);
      
      // Content is ready, navigate to dashboard
      setGeneratingDashboard(false);
      router.push('/dashboard');
      
    } catch (err) {
      const errorMessage = handleApiError(err);
      errorUtils.log('Step4Component handleSubmit', err);
      setErrors({ main_goal: errorMessage });
      setLoading(false);
      setGeneratingDashboard(false);
    }
  };

  const handleBack = () => {
    router.push('/step-3');
  };

  if (loadingSession) {
    return (
      <div className="max-w-2xl mx-auto p-6">
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
      {/* Dashboard Generation Overlay */}
      {generatingDashboard && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-8 py-6 shadow-xl pointer-events-auto">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 text-lg font-medium">
                Generating your personalized dashboard content...
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            AI-Based Patient Education Platform
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Evidence-based, personalized health education powered by artificial intelligence
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h2 className="text-xl font-semibold text-blue-900">
                Goals & Learning Preferences
              </h2>
            </div>
            <p className="text-blue-700">
              Share your health goals, questions, and learning preferences to receive personalized {condition} education.
            </p>
          </div>
        </div>
      </div>

      {/* Goals and Questions Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Health Goals</h3>
          <p className="text-gray-600">Help us create a customized educational experience tailored to your specific needs.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Goal Selection */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              What are your main goals right now?
              <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Select all that apply - you can choose multiple goals
              {formData.main_goal.length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({formData.main_goal.length} selected)
                </span>
              )}
            </p>
            
            {loadingGoals ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {availableGoals.map((goal) => (
                  <label key={goal} className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      name="main_goal"
                      value={goal}
                      checked={formData.main_goal.includes(goal)}
                      onChange={(e) => handleGoalChange(goal, e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 leading-5 font-medium">{goal}</span>
                  </label>
                ))}
                
                {/* Custom goal input */}
                {showCustomGoal && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Goal:</label>
                    <input
                      type="text"
                      placeholder="Enter your custom goal..."
                      value={customGoal}
                      onChange={(e) => handleCustomGoalChange(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}
            
            {errors.main_goal && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.main_goal}</p>
              </div>
            )}
            
            {/* Clear Selection Button */}
            {formData.main_goal.length > 0 && (
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  onClick={handleClearGoals}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {/* Main Question */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <Textarea
              label={`What's your biggest question about ${condition}?`}
              placeholder={`e.g., "How do I use my inhaler correctly?" or "What foods help with my condition?"`}
              value={formData.main_question || ''}
              onChange={(e) => updateFormData('main_question', e.target.value)}
              rows={3}
              hint="Optional - Ask educational questions about your condition. Avoid medical advice questions."
              error={errors.main_question}
              className={formData.main_question && containsMedicalAdvice(formData.main_question) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            />
            
            {/* Helpful guidance */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-blue-600 text-lg">💡</span>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-blue-900 mb-1">Ask educational questions about your condition</h5>
                  <p className="text-sm text-blue-800">Focus on learning how to manage your condition, not medical advice that requires a doctor.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Style Preference */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              How do you prefer to learn?
              <span className="text-gray-500 ml-1">(Optional)</span>
            </h4>
            <p className="text-sm text-gray-600 mb-4">This helps us show you information in your preferred format:</p>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="learning_style"
                  value="quick_tips"
                  checked={formData.learning_style === 'quick_tips'}
                  onChange={() => updateFormData('learning_style', 'quick_tips')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 leading-5">Quick tips - Short, easy-to-read information</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="learning_style"
                  value="step_by_step"
                  checked={formData.learning_style === 'step_by_step'}
                  onChange={() => updateFormData('learning_style', 'step_by_step')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 leading-5">Step-by-step guides - Detailed instructions I can follow</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="learning_style"
                  value="videos"
                  checked={formData.learning_style === 'videos'}
                  onChange={() => updateFormData('learning_style', 'videos')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 leading-5">Videos - Visual demonstrations and explanations</span>
              </label>
            </div>
          </div>


          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading || generatingDashboard}
              className="order-2 sm:order-1 hover:bg-gray-50"
            >
              <span className="mr-2">←</span>
              Back to Learning Discovery
            </Button>
            
            <Button
              type="submit"
              loading={loading}
              disabled={loading || generatingDashboard}
              className="order-1 sm:order-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <span className="mr-2">🎆</span>
              {loading ? 'Creating Dashboard...' : 'Create My Dashboard'}
            </Button>
          </div>
        </form>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step <= 4 ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Step 4 of 5 - Almost Ready!</p>
        </div>
      </div>
    </div>
  );
};