'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import { medicationsApi, userApi, handleApiError } from '../../lib/api';
import { formStorage, format, error as errorUtils } from '../../lib/utils';
import { VITALS_OPTIONS, DEFAULT_MEDICATIONS } from '../../lib/constants';
import { Step3FormData, Medication, UserSession } from '../../types';

interface MedicationSearchProps {
  selectedCondition: string;
  selectedMedications: string[];
  onMedicationsChange: (medications: string[]) => void;
  error?: string;
}

const MedicationSearch: React.FC<MedicationSearchProps> = ({
  selectedCondition,
  selectedMedications,
  onMedicationsChange,
  error
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load medications on mount
  useEffect(() => {
    const loadMedications = async () => {
      setLoading(true);
      try {
        const data = await medicationsApi.getAll();
        setMedications(data);
      } catch (err) {
        errorUtils.log('MedicationSearch loadMedications', err);
        // Fallback to default medications
        const defaultMeds = DEFAULT_MEDICATIONS.map((name, index) => ({
          id: index + 1,
          name,
          description: '',
          condition_category: ''
        }));
        setMedications(defaultMeds);
      } finally {
        setLoading(false);
      }
    };

    loadMedications();
  }, []);

  // Filter medications based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMedications([]);
      setShowDropdown(false);
      return;
    }

    const filtered = medications
      .filter(med => 
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedMedications.includes(med.name)
      )
      .map(med => med.name)
      .slice(0, 10);

    setFilteredMedications(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchQuery, medications, selectedMedications]);

  const handleMedicationSelect = (medicationName: string) => {
    if (!selectedMedications.includes(medicationName)) {
      onMedicationsChange([...selectedMedications, medicationName]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleMedicationRemove = (medicationName: string) => {
    onMedicationsChange(selectedMedications.filter(name => name !== medicationName));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Search for your medication...
      </label>
      
      {/* Selected medications */}
      {selectedMedications.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Selected medications:</p>
          <div className="flex flex-wrap gap-2">
            {selectedMedications.map((medication) => (
              <span
                key={medication}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {medication}
                <button
                  type="button"
                  onClick={() => handleMedicationRemove(medication)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          className={`block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Type to search medications (e.g., Metformin, Insulin Glargine, etc.)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowDropdown(filteredMedications.length > 0)}
          disabled={loading}
        />

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredMedications.map((medication) => (
              <button
                key={medication}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                onClick={() => handleMedicationSelect(medication)}
              >
                {medication}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
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
    diagnosis_year: undefined,
    takes_medication: false,
    medications: [],
    checks_vitals: 'No'
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

    // Validate diagnosis year if provided
    if (formData.diagnosis_year) {
      const currentYear = new Date().getFullYear();
      if (formData.diagnosis_year < 1900 || formData.diagnosis_year > currentYear) {
        newErrors.diagnosis_year = `Please enter a valid year between 1900 and ${currentYear}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId) {
      console.log('Validation failed or no userId:', { validateForm: validateForm(), userId });
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        condition_selected: userSession?.condition_selected || '',
        diagnosis_year: formData.diagnosis_year || undefined,
        takes_medication: formData.takes_medication,
        medications: formData.medications,
        checks_vitals: formData.checks_vitals,
        main_goal: undefined,
        main_question: undefined
      };
      
      console.log('Submitting Step 3 data:', submitData);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // Update user session with quiz data
      const response = await userApi.createSession(userId, submitData);
      
      console.log('Step 3 submission response:', response);

      formStorage.saveCurrentStep(4);
      router.push('/step-4');
    } catch (err: any) {
      console.error('Step 3 submission error:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });
      const errorMessage = handleApiError(err);
      errorUtils.log('Step3Component handleSubmit', err);
      setErrors({ diagnosis_year: errorMessage });
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
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h2 className="text-xl font-semibold text-blue-900">
                Health Assessment - {condition}
              </h2>
            </div>
            <p className="text-blue-700">
              Welcome, {firstName}! Help us understand your {condition} management routine.
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Medical History & Current Care</h3>
          <p className="text-gray-600">This information helps us personalize your educational content and recommendations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Diagnosis Year */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <Input
              label={`When were you diagnosed with ${condition}?`}
              type="number"
              placeholder="e.g., 2021"
              value={formData.diagnosis_year || ''}
              onChange={(e) => updateFormData('diagnosis_year', e.target.value ? parseInt(e.target.value) : undefined)}
              error={errors.diagnosis_year}
              hint="Optional - This helps us tailor information to your experience level"
              min={1900}
              max={new Date().getFullYear()}
            />
          </div>

          {/* Medication Section */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Medication Information</h4>
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700 mb-3">
                    Do you currently take any medication for {condition}?
                  </legend>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="takes_medication"
                        value="true"
                        checked={formData.takes_medication === true}
                        onChange={() => updateFormData('takes_medication', true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700 font-medium">Yes, I take medication</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="takes_medication"
                        value="false"
                        checked={formData.takes_medication === false}
                        onChange={() => updateFormData('takes_medication', false)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700 font-medium">No, I don't take medication</span>
                    </label>
                  </div>
                </fieldset>
              </div>

              {/* Medication Search - Only show if user takes medication */}
              {formData.takes_medication && (
                <div className="border-t border-gray-200 pt-6">
                  <MedicationSearch
                    selectedCondition={condition}
                    selectedMedications={formData.medications}
                    onMedicationsChange={(medications) => updateFormData('medications', medications)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Vitals Monitoring */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <Select
              label="Do you check your vitals at home?"
              value={formData.checks_vitals}
              onChange={(e) => updateFormData('checks_vitals', e.target.value as typeof formData.checks_vitals)}
              options={VITALS_OPTIONS.map(option => ({ value: option, label: option }))}
              hint="This includes blood pressure, blood sugar, weight, or other relevant measurements"
              required
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200">
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
          <p className="text-sm text-gray-500">Step 3 of 5 - Health Assessment</p>
        </div>
      </div>
    </div>
  );
};