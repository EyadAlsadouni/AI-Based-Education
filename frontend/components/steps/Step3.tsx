'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormElements';
import { userApi, handleApiError } from '../../lib/api';
import { formStorage, format, error as errorUtils } from '../../lib/utils';
import { STEP3_QUESTIONS } from '../../lib/constants';
import { Step3FormData, UserSession } from '../../types';

interface LearningDiscoveryProps {
  condition: string;
  formData: Step3FormData;
  onFormDataChange: (field: keyof Step3FormData, value: any) => void;
  errors: Partial<Record<keyof Step3FormData, string>>;
}

const LearningDiscovery: React.FC<LearningDiscoveryProps> = ({
  condition,
  formData,
  onFormDataChange,
  errors
}) => {
  const questions = STEP3_QUESTIONS[condition];
  
  if (!questions) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Questions not available for this condition.</p>
      </div>
    );
  }

  const handleInterestChange = (interest: string, checked: boolean) => {
    let updatedInterests;
    
    if (interest === 'other') {
      // Handle "Other" option specially
      if (checked) {
        updatedInterests = [...formData.main_interests, 'other'];
      } else {
        updatedInterests = formData.main_interests.filter(i => i !== 'other');
        // Clear the custom other text when unchecking
        onFormDataChange('other_knowledge', '');
      }
    } else {
      updatedInterests = checked
        ? [...formData.main_interests, interest]
        : formData.main_interests.filter(i => i !== interest);
    }
    
    onFormDataChange('main_interests', updatedInterests);
  };

  return (
    <div className="space-y-8">
      {/* Knowledge Level */}
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          {questions.knowledgeLevel.question}
          <span className="text-red-500 ml-1">*</span>
        </h4>
        <div className="space-y-3">
          {questions.knowledgeLevel.options.map((option) => (
            <label key={option.value} className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="knowledge_level"
                value={option.value}
                checked={formData.knowledge_level === option.value}
                onChange={() => onFormDataChange('knowledge_level', option.value)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700 leading-5">{option.label}</span>
            </label>
          ))}
        </div>
        {errors.knowledge_level && (
          <p className="text-sm text-red-600 mt-2">{errors.knowledge_level}</p>
        )}
      </div>

      {/* Main Interests */}
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          {questions.mainInterests.question}
          <span className="text-red-500 ml-1">*</span>
        </h4>
        <p className="text-sm text-gray-600 mb-4">Select up to 3 areas that interest you most:</p>
        <div className="space-y-3">
          {questions.mainInterests.options.map((option) => (
            <div key={option.value}>
              <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.main_interests.includes(option.value)}
                  onChange={(e) => handleInterestChange(option.value, e.target.checked)}
                  disabled={!formData.main_interests.includes(option.value) && formData.main_interests.length >= 3}
                />
                <span className="text-sm text-gray-700 leading-5">{option.label}</span>
              </label>
              
              {/* Show text input for "Other" option */}
              {option.value === 'other' && formData.main_interests.includes('other') && (
                <div className="mt-2 ml-7">
                  <Input
                    type="text"
                    placeholder="Please specify what you know about this topic..."
                    value={formData.other_knowledge || ''}
                    onChange={(e) => onFormDataChange('other_knowledge', e.target.value)}
                    error={errors.other_knowledge}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please describe your specific knowledge related to this condition.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.main_interests && (
          <p className="text-sm text-red-600 mt-2">{errors.main_interests}</p>
        )}
      </div>


    </div>
  );
};

export const Step3Component: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof Step3FormData, string>>>({});
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Step3FormData>({
    knowledge_level: 'new',
    main_interests: [],
    other_knowledge: ''
  });

  // Check if user has completed previous steps
  useEffect(() => {
    const storedUserId = formStorage.getUserId();
    if (!storedUserId) {
      router.push('/step-1');
      return;
    }
    setUserId(storedUserId);

    // Load user session to get condition
    const loadSession = async () => {
      try {
        const session = await userApi.getSession(storedUserId);
        setUserSession(session);
        
        // Load saved form data
        const savedData = formStorage.getFormData<Partial<Step3FormData>>();
        if (savedData) {
          setFormData(prev => ({ ...prev, ...savedData }));
        }
      } catch (err) {
        errorUtils.log('Step3Component loadSession', err);
        router.push('/step-2');
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [router]);

  // Save form data whenever it changes
  useEffect(() => {
    formStorage.saveFormData(formData);
  }, [formData]);

  const updateFormData = (field: keyof Step3FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user updates field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step3FormData, string>> = {};

    // Validate knowledge level (required)
    if (!formData.knowledge_level) {
      newErrors.knowledge_level = 'Please select your knowledge level';
    }

    // Validate main interests (required)
    if (formData.main_interests.length === 0) {
      newErrors.main_interests = 'Please select at least one area of interest';
    }

    // Validate "Other" option - if selected, must provide details
    if (formData.main_interests.includes('other') && (!formData.other_knowledge || formData.other_knowledge.trim().length === 0)) {
      newErrors.other_knowledge = 'Please specify what you know about this topic';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        condition_selected: userSession?.condition_selected || '',
        knowledge_level: formData.knowledge_level,
        main_interests: formData.main_interests,
        biggest_challenge: formData.biggest_challenge,
        main_goal: undefined,
        main_question: undefined
      };
      
      // Update user session with learning discovery data
      await userApi.createSession(userId, submitData);

      formStorage.saveCurrentStep(4);
      router.push('/step-4');
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      errorUtils.log('Step3Component handleSubmit', err);
      setErrors({ biggest_challenge: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/step-2');
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
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h2 className="text-xl font-semibold text-blue-900">
                Learning Needs Discovery - {condition}
              </h2>
            </div>
            <p className="text-blue-700">
              Welcome, {firstName}! Help us understand what you'd like to learn about {condition}.
            </p>
          </div>
        </div>
      </div>

      {/* Learning Discovery Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover Your Learning Needs</h3>
          <p className="text-gray-600 mb-3">This helps us create personalized educational content just for you.</p>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span className="text-red-500">*</span>
              <span>Required</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">(Optional)</span>
              <span>Optional</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <LearningDiscovery
            condition={condition}
            formData={formData}
            onFormDataChange={updateFormData}
            errors={errors}
          />

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-gray-200 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="order-2 sm:order-1 hover:bg-gray-50"
            >
              <span className="mr-2">←</span>
              Back to Condition Selection
            </Button>
            
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <span className="mr-2">→</span>
              Continue to Goal Setting
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
                  step <= 3 ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Step 3 of 5 - Learning Needs Discovery</p>
        </div>
      </div>
    </div>
  );
};