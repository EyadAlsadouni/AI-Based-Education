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
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl">🏥</span>
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
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h2 className="text-xl font-semibold text-blue-900">
                Condition Selection
              </h2>
            </div>
            <p className="text-blue-700">
              Select your primary health condition to receive personalized educational content.
            </p>
          </div>
        </div>
      </div>

      {/* Condition Selection Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Conditions</h3>
          <p className="text-gray-600">Choose the condition that best matches your health education needs.</p>
        </div>

        {/* Condition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {conditions.map((condition) => (
            <button
              key={condition.id}
              className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md medical-card ${
                selectedCondition === condition.name
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleConditionSelect(condition.name)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-2xl">
                  {condition.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {condition.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {condition.description}
                  </p>
                </div>
                {selectedCondition === condition.name && (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">!</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
            className="order-2 sm:order-1 hover:bg-gray-50"
          >
            <span className="mr-2">←</span>
            Back to Patient Information
          </Button>
          
          <Button
            onClick={handleContinue}
            loading={loading}
            disabled={!selectedCondition || loading}
            className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <span className="mr-2">→</span>
            Continue to Health Assessment
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  step <= 2 ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Step 2 of 5 - Condition Selection</p>
        </div>
      </div>
    </div>
  );
};