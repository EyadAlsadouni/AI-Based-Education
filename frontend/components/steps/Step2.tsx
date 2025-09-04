'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { conditionsApi, userApi, handleApiError } from '../../lib/api';
import { formStorage, error as errorUtils } from '../../lib/utils';
import { CONDITIONS } from '../../lib/constants';
import { Condition, ConditionName } from '../../types';

export const Step2Component: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingConditions, setLoadingConditions] = useState(true);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);

  // Check if user has completed step 1
  useEffect(() => {
    const storedUserId = formStorage.getUserId();
    if (!storedUserId) {
      router.push('/step-1');
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  // Load conditions from API
  useEffect(() => {
    const loadConditions = async () => {
      try {
        const data = await conditionsApi.getAll();
        setConditions(data);
      } catch (err) {
        errorUtils.log('Step2Component loadConditions', err);
        // Fallback to default conditions if API fails
        setConditions(CONDITIONS.map((cond, index) => ({
          id: index + 1,
          name: cond.name,
          icon: cond.icon,
          description: cond.description
        })));
      } finally {
        setLoadingConditions(false);
      }
    };

    loadConditions();
  }, []);

  // Load saved selection
  useEffect(() => {
    const savedData = formStorage.getFormData<{ selectedCondition?: string }>();
    if (savedData?.selectedCondition) {
      setSelectedCondition(savedData.selectedCondition);
    }
  }, []);

  // Save selection when it changes
  useEffect(() => {
    if (selectedCondition) {
      formStorage.saveFormData({ selectedCondition });
    }
  }, [selectedCondition]);

  const handleConditionSelect = (conditionName: string) => {
    setSelectedCondition(conditionName);
    setError('');
  };

  const handleContinue = async () => {
    if (!selectedCondition) {
      setError('Please select a condition to continue');
      return;
    }

    if (!userId) {
      setError('User session not found. Please start over.');
      return;
    }

    setLoading(true);

    try {
      // Save condition selection to user session
      await userApi.createSession(userId, {
        condition_selected: selectedCondition
      });

      formStorage.saveCurrentStep(3);
      router.push('/step-3');
    } catch (err) {
      const errorMessage = handleApiError(err);
      errorUtils.log('Step2Component handleContinue', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/step-1');
  };

  if (loadingConditions) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI-Based Patient Education
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            Step 2: Condition Selection
          </h2>
          <p className="text-blue-700">
            Please select your primary condition to get personalized guidance.
          </p>
        </div>
      </div>

      {/* Condition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {conditions.map((condition) => (
          <button
            key={condition.id}
            className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
              selectedCondition === condition.name
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleConditionSelect(condition.name)}
          >
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{condition.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {condition.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {condition.description}
                </p>
              </div>
              {selectedCondition === condition.name && (
                <div className="text-blue-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={loading}
          className="order-2 sm:order-1"
        >
          Back
        </Button>
        
        <Button
          onClick={handleContinue}
          loading={loading}
          disabled={!selectedCondition || loading}
          className="order-1 sm:order-2"
          size="lg"
        >
          Continue to Health Assessment
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 text-center">
        <div className="flex justify-center space-x-2 mb-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                step <= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">Step 2 of 5</p>
      </div>
    </div>
  );
};