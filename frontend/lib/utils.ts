import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { STORAGE_KEYS } from './constants';

// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Local storage utilities
export const storage = {
  // Get item from localStorage with error handling
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return null;
    }
  },

  // Set item in localStorage with error handling
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
    }
  },

  // Remove item from localStorage
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },

  // Get JSON object from localStorage
  getJSON: <T>(key: string): T | null => {
    const item = storage.get(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing JSON for ${key}:`, error);
      return null;
    }
  },

  // Set JSON object in localStorage
  setJSON: <T>(key: string, value: T): void => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error stringifying JSON for ${key}:`, error);
    }
  }
};

// Form data persistence utilities
export const formStorage = {
  // Save current step
  saveCurrentStep: (step: number): void => {
    storage.set(STORAGE_KEYS.CURRENT_STEP, step.toString());
  },

  // Get current step
  getCurrentStep: (): number => {
    const step = storage.get(STORAGE_KEYS.CURRENT_STEP);
    return step ? parseInt(step, 10) : 1;
  },

  // Save user ID
  saveUserId: (userId: number): void => {
    storage.set(STORAGE_KEYS.USER_ID, userId.toString());
  },

  // Get user ID
  getUserId: (): number | null => {
    const userId = storage.get(STORAGE_KEYS.USER_ID);
    return userId ? parseInt(userId, 10) : null;
  },

  // Save form data (merge with existing data)
  saveFormData: (data: any): void => {
    const existingData = storage.getJSON(STORAGE_KEYS.FORM_DATA) || {};
    const mergedData = { ...existingData, ...data };
    storage.setJSON(STORAGE_KEYS.FORM_DATA, mergedData);
  },

  // Get form data
  getFormData: <T>(): T | null => {
    return storage.getJSON<T>(STORAGE_KEYS.FORM_DATA);
  },

  // Save specific step data (for individual step saving)
  saveStepData: (stepData: any): void => {
    storage.setJSON(STORAGE_KEYS.FORM_DATA, stepData);
  },

  // Clear all stored data
  clearAll: (): void => {
    storage.remove(STORAGE_KEYS.USER_ID);
    storage.remove(STORAGE_KEYS.CURRENT_STEP);
    storage.remove(STORAGE_KEYS.FORM_DATA);
  },

  // Clear specific form field
  clearFormField: (field: string): void => {
    const existingData = storage.getJSON(STORAGE_KEYS.FORM_DATA) || {};
    delete existingData[field];
    storage.setJSON(STORAGE_KEYS.FORM_DATA, existingData);
  }
};

// Validation utilities
export const validation = {
  // Check if age is valid
  isValidAge: (age: number): boolean => {
    return age >= 1 && age <= 120;
  },

  // Check if name is valid
  isValidName: (name: string): boolean => {
    return name.trim().length >= 2;
  },

  // Check if email format is valid
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check if year is valid
  isValidYear: (year: number): boolean => {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  }
};

// Format utilities
export const format = {
  // Capitalize first letter of each word
  capitalize: (str: string): string => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  },

  // Format condition name for display
  formatConditionName: (condition: string): string => {
    return format.capitalize(condition.replace(/[-_]/g, ' '));
  },

  // Get first name from full name
  getFirstName: (fullName: string): string => {
    return fullName.split(' ')[0];
  },

  // Format age display
  formatAge: (age: number): string => {
    return `${age} year${age !== 1 ? 's' : ''} old`;
  },

  // Format medication list for display
  formatMedications: (medications: string[]): string => {
    if (medications.length === 0) return 'None';
    if (medications.length === 1) return medications[0];
    if (medications.length === 2) return medications.join(' and ');
    return `${medications.slice(0, -1).join(', ')}, and ${medications[medications.length - 1]}`;
  }
};

// Error handling utilities
export const error = {
  // Get user-friendly error message
  getUserMessage: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'An unexpected error occurred. Please try again.';
  },

  // Log error with context
  log: (context: string, error: any): void => {
    console.error(`[${context}] Error:`, error);
  }
};

// Navigation utilities
export const navigation = {
  // Get next step URL
  getNextStepUrl: (currentStep: number): string => {
    const nextStep = currentStep + 1;
    return nextStep <= 5 ? `/step-${nextStep}` : '/dashboard';
  },

  // Get previous step URL
  getPreviousStepUrl: (currentStep: number): string => {
    const prevStep = currentStep - 1;
    return prevStep >= 1 ? `/step-${prevStep}` : '/';
  },

  // Check if step is accessible
  isStepAccessible: (targetStep: number, currentStep: number): boolean => {
    return targetStep <= currentStep;
  }
};

// Delay utility for UX
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};