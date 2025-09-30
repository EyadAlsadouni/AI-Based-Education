import { HealthGoal, ConditionName } from '../types';

// Health goals options for Step 1
export const HEALTH_GOALS: HealthGoal[] = [
  'Education about the condition (e.g., Diabetes, Heart Health)',
  'Preparing for a procedure (e.g., Endoscopy, Surgery)',
  'How to use my medication (e.g., Insulin injection, Asthma inhaler)',
  'Psychological health (panic attacks, anxiety management)'
];

// Conditional condition options based on health goals
export const CONDITIONAL_CONDITIONS: Record<string, { name: string; icon: string; description: string }[]> = {
  'Education about the condition (e.g., Diabetes, Heart Health)': [
    {
      name: 'Diabetes',
      icon: '💉',
      description: 'Blood sugar control, diet, and diabetes care education'
    },
    {
      name: 'Heart & Blood Pressure',
      icon: '❤️',
      description: 'Heart disease prevention and cardiovascular health education'
    },
    {
      name: 'Respiratory (Asthma/COPD)',
      icon: '🫁',
      description: 'Asthma, COPD, and breathing condition management'
    },
    {
      name: 'Digestive / Gut Health',
      icon: '🥗',
      description: 'Understanding and managing digestive and gut health conditions'
    }
  ],
  'Preparing for a procedure (e.g., Endoscopy, Surgery)': [
    {
      name: 'Endoscopy / Colonoscopy',
      icon: '🔍',
      description: 'Preparation and recovery for digestive procedures'
    },
    {
      name: 'Day Surgery (Outpatient)',
      icon: '🏥',
      description: 'Pre-operative preparation and post-surgery care for outpatient procedures'
    },
    {
      name: 'Imaging (CT/MRI/X-ray)',
      icon: '📷',
      description: 'MRI, CT scans, X-rays, and other imaging tests preparation'
    },
    {
      name: 'Dental Procedure / Extraction',
      icon: '🦷',
      description: 'Oral surgery and dental procedure preparation'
    }
  ],
  'How to use my medication (e.g., Insulin injection, Asthma inhaler)': [
    {
      name: 'Insulin & Diabetes Medicines',
      icon: '💉',
      description: 'Insulin injection techniques and diabetes medication management'
    },
    {
      name: 'Inhalers (Asthma/COPD)',
      icon: '🌬️',
      description: 'Proper inhaler use and respiratory medication techniques'
    },
    {
      name: 'Blood-Pressure Medicines',
      icon: '💊',
      description: 'Blood pressure medication management and monitoring'
    },
    {
      name: 'Cholesterol Medicines (Statins)',
      icon: '🧬',
      description: 'Cholesterol medication management and statin therapy'
    }
  ],
  'Psychological health (panic attacks, anxiety management)': [
    {
      name: 'Anxiety & Panic',
      icon: '😰',
      description: 'Managing anxiety disorders and panic attack strategies'
    },
    {
      name: 'Depression',
      icon: '😔',
      description: 'Understanding and coping with depression'
    },
    {
      name: 'Stress & Coping',
      icon: '🧘',
      description: 'Stress management techniques and healthy coping methods'
    },
    {
      name: 'Sleep Health',
      icon: '😴',
      description: 'Improving sleep quality and overall mental wellness'
    }
  ]
};

// Legacy condition options (for backward compatibility)
export const CONDITIONS: { name: ConditionName; icon: string; description: string }[] = [
  {
    name: 'Diabetes',
    icon: '💉',
    description: 'Blood sugar management and diabetes care'
  },
  {
    name: 'Heart Health',
    icon: '❤️',
    description: 'Cardiovascular health and heart disease prevention'
  },
  {
    name: 'Pre-Procedure Prep',
    icon: '🏥',
    description: 'Preparation for medical procedures and surgeries'
  },
  {
    name: 'Mental Wellness',
    icon: '😌',
    description: 'Mental health support and wellness strategies'
  }
];

// Vitals checking options for Step 3
export const VITALS_OPTIONS = [
  'Yes, regularly',
  'Yes, occasionally',
  'No'
] as const;

// Gender options
export const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

// Default condition goals (fallback if API fails)
export const DEFAULT_CONDITION_GOALS: Record<string, string[]> = {
  diabetes: [
    'Lower my blood sugar levels',
    'Understand my medications',
    'Plan diabetes-friendly meals',
    'Learn to monitor glucose levels',
    'Manage complications',
    'Feel more confident in managing my day',
    'Other...'
  ],
  'heart health': [
    'Lower my cholesterol',
    'Understand my heart medications',
    'Plan heart-healthy meals',
    'Learn safe exercise routines',
    'Manage blood pressure',
    'Prevent heart attacks',
    'Other...'
  ],
  'pre-procedure prep': [
    'Understand my upcoming procedure',
    'Know what to expect during recovery',
    'Prepare mentally for the procedure',
    'Learn about post-procedure care',
    'Manage pre-procedure anxiety',
    'Follow pre-procedure instructions',
    'Other...'
  ],
  'mental wellness': [
    'Manage anxiety and stress',
    'Improve my mood',
    'Develop coping strategies',
    'Understand my mental health medications',
    'Build healthy routines',
    'Improve sleep quality',
    'Other...'
  ]
};

// Medication list (fallback if API fails)
export const DEFAULT_MEDICATIONS = [
  'Metformin',
  'Insulin Glargine (Lantus/Basaglar)',
  'Empagliflozin (Jardiance)',
  'Semaglutide (Ozempic/Rybelsus)',
  'Atorvastatin (Lipitor)',
  'Amlodipine',
  'Losartan',
  'Aspirin (low-dose, 81mg)',
  'Sertraline (Zoloft)',
  'Lorazepam (Ativan)'
];

// Dashboard card information
export const DASHBOARD_CARDS = [
  {
    id: 'diagnosis',
    title: 'Diagnosis Basics',
    description: 'Knowledge base about your diagnosis',
    icon: '📚'
  },
  {
    id: 'nutrition',
    title: 'Nutrition and Carbs',
    description: 'Dietary guidance and meal planning',
    icon: '🥗'
  },
  {
    id: 'workout',
    title: 'Workout',
    description: 'Videos tutorials and tips for exercise',
    icon: '💪'
  },
  {
    id: 'daily_plan',
    title: 'Plan Your Day',
    description: 'Daily checklist and management tips',
    icon: '📅'
  }
];

// Step names for navigation
export const STEP_NAMES = [
  'Personal Information',
  'Condition Selection',
  'Health Assessment',
  'Goals & Questions',
  'Your Dashboard'
];

// Local storage keys
export const STORAGE_KEYS = {
  USER_ID: 'patient_education_user_id',
  CURRENT_STEP: 'patient_education_current_step',
  FORM_DATA: 'patient_education_form_data'
};