'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import { userApi, handleApiError } from '../../lib/api';
import { formStorage, validation, error as errorUtils } from '../../lib/utils';
import { HEALTH_GOALS, GENDER_OPTIONS } from '../../lib/constants';
import { Step1FormData, HealthGoal } from '../../types';

export const Step1Component: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Step1FormData, string>>>({});
  const [formData, setFormData] = useState<Step1FormData>({
    full_name: '',
    gender: 'male',
    age: 0,
    health_goals: []
  });

  // Load saved form data on mount
  useEffect(() => {
    const savedData = formStorage.getFormData<Partial<Step1FormData>>();
    if (savedData) {
      setFormData(prev => ({ ...prev, ...savedData }));
    }
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    formStorage.saveFormData(formData);
  }, [formData]);

  const updateFormData = (field: keyof Step1FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleHealthGoalChange = (goal: HealthGoal, checked: boolean) => {
    const updatedGoals = checked
      ? [...formData.health_goals, goal]
      : formData.health_goals.filter(g => g !== goal);
    
    updateFormData('health_goals', updatedGoals);
  };

  const handleClearHealthGoals = () => {
    updateFormData('health_goals', []);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step1FormData, string>> = {};

    // Validate full name
    if (!validation.isValidName(formData.full_name)) {
      newErrors.full_name = 'Please enter a valid full name (at least 2 characters)';
    }

    // Validate age
    if (!formData.age || !validation.isValidAge(formData.age)) {
      newErrors.age = 'Please enter a valid age between 1 and 120';
    }

    // Validate health goals
    if (formData.health_goals.length === 0) {
      newErrors.health_goals = 'Please select at least one health goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create user via API
      const response = await userApi.create(formData);
      
      if (response.success && response.user_id) {
        // Save user ID for subsequent steps
        formStorage.saveUserId(response.user_id);
        formStorage.saveCurrentStep(2);
        
        // Navigate to step 2
        router.push('/step-2');
      } else {
        throw new Error('Failed to create user account');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      errorUtils.log('Step1Component handleSubmit', err);
      
      // Show error to user
      setErrors({ full_name: errorMessage });
    } finally {
      setLoading(false);
    }
  };

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
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h2 className="text-xl font-semibold text-blue-900">
                Patient Information
              </h2>
            </div>
            <p className="text-blue-700">
              Please provide your basic information to personalize your health education experience.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={(e) => updateFormData('full_name', e.target.value)}
            error={errors.full_name}
            required
          />

          {/* Gender and Age Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => updateFormData('gender', e.target.value as 'male' | 'female' | 'other')}
              options={GENDER_OPTIONS}
              required
            />
            
            <Input
              label="Age"
              type="number"
              placeholder="Enter your age"
              value={formData.age || ''}
              onChange={(e) => updateFormData('age', parseInt(e.target.value) || 0)}
              error={errors.age}
              min={1}
              max={120}
              required
            />
          </div>

          {/* Health Goals */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              What is your primary health goal? 
              <span className="text-red-500 ml-1">*</span>
              <span className="text-gray-500 font-normal"> (Select all that apply)</span>
            </label>
            <div className="space-y-3">
              {HEALTH_GOALS.map((goal) => (
                <label key={goal} className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.health_goals.includes(goal)}
                    onChange={(e) => handleHealthGoalChange(goal, e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 leading-5">{goal}</span>
                </label>
              ))}
            </div>
            {errors.health_goals && (
              <p className="text-sm text-red-600">{errors.health_goals}</p>
            )}
            
            {/* Clear Selection Button */}
            {formData.health_goals.length > 0 && (
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  onClick={handleClearHealthGoals}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
              loading={loading}
              disabled={loading}
            >
              <span className="mr-2">→</span>
              Continue to Condition Selection
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
                  step === 1 ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Step 1 of 5 - Patient Information</p>
        </div>
      </div>
    </div>
  );
};