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

// Step 3 Learning Discovery Questions
export const STEP3_QUESTIONS: Record<string, {
  knowledgeLevel: {
    question: string;
    options: { value: string; label: string }[];
  };
  mainInterests: {
    question: string;
    options: { value: string; label: string }[];
  };
  biggestChallenge: {
    question: string;
    placeholder: string;
    examples: string[];
  };
  learningStyle: {
    question: string;
    options: { value: string; label: string }[];
  };
}> = {
  'Diabetes': {
    knowledgeLevel: {
      question: 'How familiar are you with diabetes?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about diabetes' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about diabetes?',
      options: [
        { value: 'blood_sugar', label: 'Blood sugar monitoring and control' },
        { value: 'diet', label: 'Eating right and meal planning' },
        { value: 'exercise', label: 'Safe exercise and physical activity' },
        { value: 'medications', label: 'Understanding my diabetes medications' },
        { value: 'daily_life', label: 'Managing diabetes in daily life' },
        { value: 'complications', label: 'Preventing diabetes complications' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with diabetes right now?',
      placeholder: 'e.g., "Keeping my blood sugar stable after meals" or "Remembering to check my blood sugar"',
      examples: [
        'Keeping blood sugar stable after meals',
        'Remembering to check blood sugar regularly',
        'Planning diabetes-friendly meals',
        'Understanding when to take medications',
        'Managing diabetes at work or social events'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Heart & Blood Pressure': {
    knowledgeLevel: {
      question: 'How familiar are you with heart health?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about heart health' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about heart health?',
      options: [
        { value: 'blood_pressure', label: 'Managing blood pressure' },
        { value: 'heart_healthy_diet', label: 'Heart-healthy eating' },
        { value: 'safe_exercise', label: 'Safe exercise for heart health' },
        { value: 'medications', label: 'Understanding heart medications' },
        { value: 'stress', label: 'Managing stress and heart health' },
        { value: 'warning_signs', label: 'Recognizing warning signs' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with heart health right now?',
      placeholder: 'e.g., "Keeping my blood pressure under control" or "Finding time for heart-healthy exercise"',
      examples: [
        'Keeping blood pressure under control',
        'Finding time for heart-healthy exercise',
        'Understanding heart medications',
        'Managing stress and heart health',
        'Planning heart-healthy meals'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Respiratory (Asthma/COPD)': {
    knowledgeLevel: {
      question: 'How familiar are you with managing breathing conditions?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about breathing conditions' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about breathing conditions?',
      options: [
        { value: 'inhaler_use', label: 'Using inhalers correctly' },
        { value: 'breathing_exercises', label: 'Breathing exercises and techniques' },
        { value: 'triggers', label: 'Identifying and avoiding triggers' },
        { value: 'medications', label: 'Understanding breathing medications' },
        { value: 'exercise', label: 'Safe exercise with breathing conditions' },
        { value: 'emergency', label: 'What to do in breathing emergencies' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with your breathing condition right now?',
      placeholder: 'e.g., "Using my inhaler correctly" or "Managing breathing problems during exercise"',
      examples: [
        'Using inhalers correctly',
        'Managing breathing problems during exercise',
        'Identifying what triggers breathing problems',
        'Remembering to take breathing medications',
        'Dealing with breathing emergencies'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Digestive / Gut Health': {
    knowledgeLevel: {
      question: 'How familiar are you with digestive health?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about digestive health' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about digestive health?',
      options: [
        { value: 'diet', label: 'Foods that help or hurt digestion' },
        { value: 'symptoms', label: 'Understanding digestive symptoms' },
        { value: 'medications', label: 'Managing digestive medications' },
        { value: 'lifestyle', label: 'Lifestyle changes for better digestion' },
        { value: 'stress', label: 'How stress affects digestion' },
        { value: 'when_to_see_doctor', label: 'When to see a doctor' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with digestive health right now?',
      placeholder: 'e.g., "Finding foods that don\'t upset my stomach" or "Understanding my digestive symptoms"',
      examples: [
        'Finding foods that don\'t upset my stomach',
        'Understanding my digestive symptoms',
        'Managing digestive medications',
        'Dealing with stress and digestion',
        'Knowing when to see a doctor'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  // Medication-specific questions
  'Insulin & Diabetes Medicines': {
    knowledgeLevel: {
      question: 'How familiar are you with diabetes medications?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about diabetes medications' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about diabetes medications?',
      options: [
        { value: 'injection_technique', label: 'Proper injection techniques' },
        { value: 'timing', label: 'When and how often to take medications' },
        { value: 'storage', label: 'How to store medications safely' },
        { value: 'side_effects', label: 'Understanding side effects' },
        { value: 'adjusting_doses', label: 'When and how to adjust doses' },
        { value: 'emergency', label: 'What to do in emergency situations' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with diabetes medications right now?',
      placeholder: 'e.g., "Getting the injection technique right" or "Remembering when to take my medications"',
      examples: [
        'Getting the injection technique right',
        'Remembering when to take my medications',
        'Understanding how to adjust doses',
        'Managing side effects',
        'Storing medications properly'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Inhalers (Asthma/COPD)': {
    knowledgeLevel: {
      question: 'How familiar are you with inhaler use?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about inhalers' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about inhaler use?',
      options: [
        { value: 'proper_technique', label: 'Using inhalers correctly' },
        { value: 'different_types', label: 'Understanding different types of inhalers' },
        { value: 'timing', label: 'When and how often to use inhalers' },
        { value: 'cleaning', label: 'Cleaning and maintaining inhalers' },
        { value: 'troubleshooting', label: 'Fixing common problems' },
        { value: 'emergency', label: 'Emergency inhaler use' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with inhaler use right now?',
      placeholder: 'e.g., "Using my inhaler correctly" or "Remembering to use it regularly"',
      examples: [
        'Using my inhaler correctly',
        'Remembering to use it regularly',
        'Understanding when to use each type',
        'Cleaning and maintaining it',
        'Dealing with side effects'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Blood-Pressure Medicines': {
    knowledgeLevel: {
      question: 'How familiar are you with blood pressure medications?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about blood pressure medications' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about blood pressure medications?',
      options: [
        { value: 'timing', label: 'When and how often to take medications' },
        { value: 'side_effects', label: 'Understanding and managing side effects' },
        { value: 'interactions', label: 'Drug interactions and food interactions' },
        { value: 'monitoring', label: 'Monitoring blood pressure at home' },
        { value: 'lifestyle', label: 'How lifestyle affects medications' },
        { value: 'emergency', label: 'What to do if blood pressure is too high or low' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with blood pressure medications right now?',
      placeholder: 'e.g., "Remembering to take my medications" or "Managing side effects"',
      examples: [
        'Remembering to take my medications',
        'Managing side effects',
        'Understanding drug interactions',
        'Monitoring blood pressure at home',
        'Knowing when to call the doctor'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Cholesterol Medicines (Statins)': {
    knowledgeLevel: {
      question: 'How familiar are you with cholesterol medications?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about cholesterol medications' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about cholesterol medications?',
      options: [
        { value: 'timing', label: 'When and how often to take medications' },
        { value: 'side_effects', label: 'Understanding and managing side effects' },
        { value: 'interactions', label: 'Drug interactions and food interactions' },
        { value: 'monitoring', label: 'Monitoring cholesterol levels' },
        { value: 'lifestyle', label: 'How diet and exercise affect medications' },
        { value: 'long_term', label: 'Long-term effects and benefits' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with cholesterol medications right now?',
      placeholder: 'e.g., "Managing muscle pain from statins" or "Understanding if the medication is working"',
      examples: [
        'Managing muscle pain from statins',
        'Understanding if the medication is working',
        'Dealing with side effects',
        'Understanding drug interactions',
        'Knowing when to call the doctor'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  // Procedure-specific questions
  'Endoscopy / Colonoscopy': {
    knowledgeLevel: {
      question: 'How familiar are you with endoscopy procedures?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about endoscopy' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about your endoscopy procedure?',
      options: [
        { value: 'preparation', label: 'Pre-procedure preparation steps' },
        { value: 'what_to_expect', label: 'What to expect during the procedure' },
        { value: 'recovery', label: 'Recovery process and timeline' },
        { value: 'diet_restrictions', label: 'Diet restrictions and changes' },
        { value: 'medication_adjustments', label: 'Medication adjustments needed' },
        { value: 'results', label: 'Understanding your results' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest concern about the endoscopy procedure?',
      placeholder: 'e.g., "The preparation process" or "What happens during the procedure"',
      examples: [
        'The preparation process',
        'What happens during the procedure',
        'Recovery discomfort',
        'Understanding the results',
        'Managing anxiety about the procedure'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Day Surgery (Outpatient)': {
    knowledgeLevel: {
      question: 'How familiar are you with outpatient surgery?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about outpatient surgery' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about your outpatient surgery?',
      options: [
        { value: 'preparation', label: 'Pre-surgery preparation' },
        { value: 'surgery_day', label: 'What to expect on surgery day' },
        { value: 'recovery', label: 'Post-surgery recovery process' },
        { value: 'pain_management', label: 'Managing pain after surgery' },
        { value: 'activity_restrictions', label: 'Activity restrictions and limitations' },
        { value: 'follow_up', label: 'Follow-up care and appointments' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest concern about the outpatient surgery?',
      placeholder: 'e.g., "Pre-surgery anxiety" or "Managing recovery at home"',
      examples: [
        'Pre-surgery anxiety',
        'Managing recovery at home',
        'Pain management after surgery',
        'Returning to normal activities',
        'Understanding activity restrictions'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Imaging (CT/MRI/X-ray)': {
    knowledgeLevel: {
      question: 'How familiar are you with imaging tests?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about imaging tests' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about your imaging test?',
      options: [
        { value: 'preparation', label: 'Pre-test preparation requirements' },
        { value: 'what_to_expect', label: 'What to expect during the test' },
        { value: 'safety', label: 'Safety considerations and concerns' },
        { value: 'results', label: 'Understanding your test results' },
        { value: 'follow_up', label: 'Follow-up procedures if needed' },
        { value: 'cost', label: 'Cost and insurance coverage' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest concern about the imaging test?',
      placeholder: 'e.g., "Claustrophobia during MRI" or "Understanding the results"',
      examples: [
        'Claustrophobia during MRI',
        'Radiation exposure concerns',
        'Understanding the results',
        'Preparation requirements',
        'Cost and insurance coverage'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  },
  'Dental Procedure / Extraction': {
    knowledgeLevel: {
      question: 'How familiar are you with dental procedures?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about dental procedures' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about your dental procedure?',
      options: [
        { value: 'preparation', label: 'Pre-procedure preparation' },
        { value: 'what_to_expect', label: 'What to expect during the procedure' },
        { value: 'recovery', label: 'Post-procedure care and recovery' },
        { value: 'pain_management', label: 'Managing pain and discomfort' },
        { value: 'diet_modifications', label: 'Diet modifications after procedure' },
        { value: 'healing', label: 'Healing timeline and what to expect' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest concern about the dental procedure?',
      placeholder: 'e.g., "Pain during or after the procedure" or "Recovery process"',
      examples: [
        'Pain during or after the procedure',
        'Recovery process and timeline',
        'Cost and insurance coverage',
        'Procedure anxiety',
        'Diet restrictions after procedure'
      ]
    },
    learningStyle: {
      question: 'How do you prefer to learn?',
      options: [
        { value: 'quick_tips', label: 'Quick tips - Short, easy-to-read information' },
        { value: 'step_by_step', label: 'Step-by-step guides - Detailed instructions I can follow' },
        { value: 'videos', label: 'Videos - Visual demonstrations and explanations' }
      ]
    }
  }
};

// Step names for navigation
export const STEP_NAMES = [
  'Personal Information',
  'Condition Selection',
  'Learning Needs Discovery',
  'Goals & Questions',
  'Your Dashboard'
];

// Local storage keys
export const STORAGE_KEYS = {
  USER_ID: 'patient_education_user_id',
  CURRENT_STEP: 'patient_education_current_step',
  FORM_DATA: 'patient_education_form_data'
};