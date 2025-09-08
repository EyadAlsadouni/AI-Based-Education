'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Select, Textarea } from '../ui/FormElements';
import { conditionsApi, userApi, aiApi, handleApiError } from '../../lib/api';
import { formStorage, format, error as errorUtils } from '../../lib/utils';
import { DEFAULT_CONDITION_GOALS } from '../../lib/constants';
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
    main_goal: '',
    main_question: ''
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
          if (savedData.main_goal && !DEFAULT_CONDITION_GOALS[session.condition_selected.toLowerCase()]?.includes(savedData.main_goal)) {
            setShowCustomGoal(true);
            setCustomGoal(savedData.main_goal);
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

  // Load condition-specific goals
  useEffect(() => {
    if (!userSession?.condition_selected) return;

    const loadGoals = async () => {
      setLoadingGoals(true);
      try {
        const goalsData = await conditionsApi.getGoals(userSession.condition_selected);
        setAvailableGoals(goalsData.goals);
      } catch (err) {
        errorUtils.log('Step4Component loadGoals', err);
        // Fallback to default goals
        const conditionKey = userSession.condition_selected.toLowerCase();
        const defaultGoals = DEFAULT_CONDITION_GOALS[conditionKey] || DEFAULT_CONDITION_GOALS['diabetes'];
        setAvailableGoals(defaultGoals);
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
  };

  const handleGoalChange = (selectedGoal: string) => {
    if (selectedGoal === 'Other...') {
      setShowCustomGoal(true);
      updateFormData('main_goal', customGoal);
    } else {
      setShowCustomGoal(false);
      setCustomGoal('');
      updateFormData('main_goal', selectedGoal);
    }
  };

  const handleCustomGoalChange = (value: string) => {
    setCustomGoal(value);
    if (showCustomGoal) {
      updateFormData('main_goal', value);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step4FormData, string>> = {};

    // Validate main goal
    if (!formData.main_goal || formData.main_goal.trim().length === 0) {
      newErrors.main_goal = 'Please select or enter your main goal';
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
      // Update user session with goals and questions
      await userApi.createSession(userId, {
        condition_selected: userSession.condition_selected,
        diagnosis_year: userSession.diagnosis_year,
        takes_medication: userSession.takes_medication,
        medications: userSession.medications,
        checks_vitals: userSession.checks_vitals,
        ...formData
      });

      // Mark step as complete
      formStorage.saveCurrentStep(5);
      
      // Start dashboard generation with overlay
      setLoading(false);
      setGeneratingDashboard(true);
      
      // Generate AI dashboard content
      await aiApi.generateDashboard(userId);
      
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
                Goals & Personalization
              </h2>
            </div>
            <p className="text-blue-700">
              Share your health goals and questions to receive personalized {condition} education.
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
              What is your main goal right now?
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            {loadingGoals ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {availableGoals.map((goal) => (
                  <label key={goal} className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="main_goal"
                      value={goal}
                      checked={!showCustomGoal && formData.main_goal === goal}
                      onChange={() => handleGoalChange(goal)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
          </div>

          {/* Main Question */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <Textarea
              label={`What is your biggest question about ${condition}?`}
              placeholder={`e.g., "What can I eat for breakfast that won't spike my blood sugar?" or "How often should I exercise?"`}
              value={formData.main_question || ''}
              onChange={(e) => updateFormData('main_question', e.target.value)}
              rows={4}
              hint="Optional - This helps us provide more personalized information"
            />
          </div>

          {/* Example Questions */}
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">❓</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                Common questions about {condition}:
              </h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-2 ml-9">
              {condition === 'Diabetes' && (
                <>
                  <li>• "What foods should I avoid?"</li>
                  <li>• "How do I count carbohydrates?"</li>
                  <li>• "What should my blood sugar levels be?"</li>
                  <li>• "How often should I check my glucose?"</li>
                </>
              )}
              {condition === 'Heart Health' && (
                <>
                  <li>• "What exercises are safe for my heart?"</li>
                  <li>• "How can I lower my cholesterol naturally?"</li>
                  <li>• "What foods are heart-healthy?"</li>
                  <li>• "How do I manage stress for better heart health?"</li>
                </>
              )}
              {condition === 'Pre-Procedure Prep' && (
                <>
                  <li>• "How should I prepare for my procedure?"</li>
                  <li>• "What should I expect during recovery?"</li>
                  <li>• "What medications should I stop before the procedure?"</li>
                  <li>• "How can I manage pre-procedure anxiety?"</li>
                </>
              )}
              {condition === 'Mental Wellness' && (
                <>
                  <li>• "How can I manage my anxiety daily?"</li>
                  <li>• "What are healthy coping strategies?"</li>
                  <li>• "How important is sleep for mental health?"</li>
                  <li>• "When should I seek additional help?"</li>
                </>
              )}
            </ul>
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
              Back to Health Assessment
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