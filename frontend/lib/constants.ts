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

// Dynamic Step 4 goal options based on user's previous choices
export const DYNAMIC_STEP4_GOALS: Record<string, {
  knowledgeLevel: Record<string, string[]>;
  mainInterests: Record<string, string[]>;
  healthGoal: Record<string, string[]>;
}> = {
  // Education about the condition
  'Education about the condition (e.g., Diabetes, Heart Health)': {
    knowledgeLevel: {
      new: [
        'Learn the basics about my condition',
        'Understand what causes my condition',
        'Know the warning signs to watch for',
        'Learn how to manage it daily',
        'Other...'
      ],
      some: [
        'Deepen my understanding of my condition',
        'Learn advanced management strategies',
        'Understand complications and prevention',
        'Improve my daily management routine',
        'Other...'
      ],
      experienced: [
        'Stay updated on latest treatments',
        'Optimize my current management plan',
        'Learn about new research findings',
        'Help others with similar conditions',
        'Other...'
      ]
    },
    mainInterests: {
      blood_sugar: [
        'Keep my blood sugar stable',
        'Understand blood sugar patterns',
        'Learn about blood sugar monitoring',
        'Manage blood sugar during illness',
        'Other...'
      ],
      diet: [
        'Plan healthy meals for my condition',
        'Understand food effects on my condition',
        'Learn about portion control',
        'Find condition-friendly recipes',
        'Other...'
      ],
      exercise: [
        'Find safe exercises for my condition',
        'Learn how exercise affects my condition',
        'Create a sustainable exercise routine',
        'Manage my condition during workouts',
        'Other...'
      ],
      medications: [
        'Understand how my medications work',
        'Learn about medication side effects',
        'Know when to adjust medications',
        'Manage multiple medications safely',
        'Other...'
      ],
      daily_life: [
        'Integrate condition management into daily life',
        'Manage my condition at work',
        'Travel safely with my condition',
        'Handle social situations with my condition',
        'Other...'
      ],
      complications: [
        'Prevent serious complications',
        'Recognize early warning signs',
        'Know when to seek emergency help',
        'Manage existing complications',
        'Other...'
      ]
    },
    healthGoal: {
      'Education about the condition (e.g., Diabetes, Heart Health)': [
        'Understand my condition better',
        'Learn effective management strategies',
        'Improve my quality of life',
        'Prevent complications',
        'Other...'
      ]
    }
  },
  // How to use my medication
  'How to use my medication (e.g., Insulin injection, Asthma inhaler)': {
    knowledgeLevel: {
      new: [
        'Learn proper medication technique',
        'Understand when and how to take my medication',
        'Know how to store my medication safely',
        'Build confidence in using my medication',
        'Other...'
      ],
      some: [
        'Improve my medication technique',
        'Learn advanced medication management',
        'Optimize my medication timing',
        'Troubleshoot common medication issues',
        'Other...'
      ],
      experienced: [
        'Fine-tune my medication routine',
        'Learn about new medication options',
        'Help others with similar medications',
        'Stay updated on best practices',
        'Other...'
      ]
    },
    mainInterests: {
      technique: [
        'Master proper medication technique',
        'Learn different administration methods',
        'Understand proper timing and dosing',
        'Know how to adjust for different situations',
        'Other...'
      ],
      safety: [
        'Use my medication safely',
        'Recognize and prevent side effects',
        'Know about drug interactions',
        'Store and handle medication properly',
        'Other...'
      ],
      troubleshooting: [
        'Solve common medication problems',
        'Know when to call my doctor',
        'Handle medication emergencies',
        'Adjust for lifestyle changes',
        'Other...'
      ],
      confidence: [
        'Feel confident using my medication',
        'Overcome medication anxiety',
        'Teach others about my medication',
        'Manage medication in public',
        'Other...'
      ]
    },
    healthGoal: {
      'How to use my medication (e.g., Insulin injection, Asthma inhaler)': [
        'Master proper medication technique',
        'Use my medication safely and effectively',
        'Feel confident managing my medication',
        'Optimize my medication routine',
        'Other...'
      ]
    }
  },
  // Preparing for a procedure
  'Preparing for a procedure (e.g., Endoscopy, Surgery)': {
    knowledgeLevel: {
      new: [
        'Understand what my procedure involves',
        'Learn how to prepare properly',
        'Know what to expect during recovery',
        'Feel confident about the procedure',
        'Other...'
      ],
      some: [
        'Optimize my preparation process',
        'Learn advanced recovery strategies',
        'Understand potential complications',
        'Prepare for the best possible outcome',
        'Other...'
      ],
      experienced: [
        'Fine-tune my preparation routine',
        'Learn about new procedure techniques',
        'Help others prepare for similar procedures',
        'Stay updated on best practices',
        'Other...'
      ]
    },
    mainInterests: {
      preparation: [
        'Follow pre-procedure instructions correctly',
        'Prepare my body for the procedure',
        'Arrange necessary support and care',
        'Manage pre-procedure anxiety',
        'Other...'
      ],
      what_to_expect: [
        'Know what happens during the procedure',
        'Understand the recovery process',
        'Learn about pain management',
        'Know when to call the doctor',
        'Other...'
      ],
      recovery: [
        'Heal properly after the procedure',
        'Manage pain and discomfort',
        'Return to normal activities safely',
        'Prevent complications during recovery',
        'Other...'
      ],
      diet_restrictions: [
        'Follow post-procedure diet guidelines',
        'Understand what foods to avoid',
        'Plan nutritious recovery meals',
        'Manage appetite changes',
        'Other...'
      ],
      medication_adjustments: [
        'Adjust medications before procedure',
        'Manage medications during recovery',
        'Understand drug interactions',
        'Know when to resume normal medications',
        'Other...'
      ],
      results: [
        'Understand my procedure results',
        'Know what the results mean',
        'Plan follow-up care',
        'Make informed decisions about next steps',
        'Other...'
      ]
    },
    healthGoal: {
      'Preparing for a procedure (e.g., Endoscopy, Surgery)': [
        'Prepare thoroughly for my procedure',
        'Have a smooth recovery process',
        'Understand what to expect',
        'Feel confident and informed',
        'Other...'
      ]
    }
  },
  // Psychological health
  'Psychological health (panic attacks, anxiety management)': {
    knowledgeLevel: {
      new: [
        'Understand my mental health condition',
        'Learn basic coping strategies',
        'Know when to seek professional help',
        'Build a support system',
        'Other...'
      ],
      some: [
        'Develop advanced coping skills',
        'Learn about treatment options',
        'Improve my daily mental health routine',
        'Understand triggers and prevention',
        'Other...'
      ],
      experienced: [
        'Fine-tune my mental health strategies',
        'Learn about new treatment approaches',
        'Help others with similar challenges',
        'Stay updated on mental health research',
        'Other...'
      ]
    },
    mainInterests: {
      anxiety: [
        'Manage daily anxiety effectively',
        'Learn panic attack prevention strategies',
        'Develop anxiety coping techniques',
        'Build confidence in anxiety management',
        'Other...'
      ],
      depression: [
        'Improve my mood and outlook',
        'Develop depression coping strategies',
        'Build healthy daily routines',
        'Understand depression treatment options',
        'Other...'
      ],
      stress: [
        'Manage stress in healthy ways',
        'Learn stress reduction techniques',
        'Create work-life balance',
        'Develop resilience to stress',
        'Other...'
      ],
      sleep: [
        'Improve my sleep quality',
        'Develop healthy sleep habits',
        'Manage sleep-related anxiety',
        'Understand sleep and mental health connection',
        'Other...'
      ]
    },
    healthGoal: {
      'Psychological health (panic attacks, anxiety management)': [
        'Improve my mental health and wellbeing',
        'Develop effective coping strategies',
        'Build resilience and confidence',
        'Create a sustainable mental health routine',
        'Other...'
      ]
    }
  }
};

// Legacy condition goals (fallback if API fails)
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
  },
  // Psychological health conditions
  'Anxiety & Panic': {
    knowledgeLevel: {
      question: 'How familiar are you with managing anxiety and panic?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about anxiety management' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about managing anxiety?',
      options: [
        { value: 'breathing_techniques', label: 'Breathing and relaxation techniques' },
        { value: 'panic_attacks', label: 'Managing panic attacks' },
        { value: 'triggers', label: 'Identifying and managing anxiety triggers' },
        { value: 'coping_strategies', label: 'Healthy coping strategies' },
        { value: 'medication', label: 'Understanding anxiety medications' },
        { value: 'lifestyle', label: 'Lifestyle changes for anxiety management' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with anxiety right now?',
      placeholder: 'e.g., "Managing panic attacks" or "Feeling anxious in social situations"',
      examples: [
        'Managing panic attacks',
        'Feeling anxious in social situations',
        'Sleep problems due to anxiety',
        'Work-related anxiety',
        'General worry and overthinking'
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
  'Depression': {
    knowledgeLevel: {
      question: 'How familiar are you with managing depression?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about depression management' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about managing depression?',
      options: [
        { value: 'mood_regulation', label: 'Mood regulation strategies' },
        { value: 'daily_routines', label: 'Building healthy daily routines' },
        { value: 'medication', label: 'Understanding depression medications' },
        { value: 'therapy', label: 'Therapy and counseling approaches' },
        { value: 'lifestyle', label: 'Lifestyle changes for depression' },
        { value: 'support_systems', label: 'Building support systems' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with depression right now?',
      placeholder: 'e.g., "Lack of motivation" or "Feeling hopeless about the future"',
      examples: [
        'Lack of motivation and energy',
        'Feeling hopeless about the future',
        'Sleep problems',
        'Difficulty concentrating',
        'Social isolation'
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
  'Stress & Coping': {
    knowledgeLevel: {
      question: 'How familiar are you with stress management?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about stress management' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about stress management?',
      options: [
        { value: 'relaxation_techniques', label: 'Relaxation techniques' },
        { value: 'time_management', label: 'Time management and organization' },
        { value: 'work_life_balance', label: 'Work-life balance' },
        { value: 'mindfulness', label: 'Mindfulness and meditation' },
        { value: 'physical_activity', label: 'Physical activity for stress relief' },
        { value: 'coping_skills', label: 'Healthy coping skills' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with stress right now?',
      placeholder: 'e.g., "Work pressure" or "Finding time for self-care"',
      examples: [
        'Work pressure and deadlines',
        'Finding time for self-care',
        'Financial stress',
        'Relationship stress',
        'Health-related stress'
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
  'Sleep Health': {
    knowledgeLevel: {
      question: 'How familiar are you with sleep health?',
      options: [
        { value: 'new', label: 'New to this - I\'m just starting to learn about sleep health' },
        { value: 'some', label: 'Some experience - I know the basics but want to learn more' },
        { value: 'experienced', label: 'Quite knowledgeable - I understand it well but want specific tips' }
      ]
    },
    mainInterests: {
      question: 'What would you most like to learn about sleep health?',
      options: [
        { value: 'sleep_hygiene', label: 'Sleep hygiene and routines' },
        { value: 'sleep_disorders', label: 'Understanding sleep disorders' },
        { value: 'medication', label: 'Sleep medications and alternatives' },
        { value: 'lifestyle', label: 'Lifestyle changes for better sleep' },
        { value: 'stress_sleep', label: 'Managing stress and sleep' },
        { value: 'environment', label: 'Creating a sleep-friendly environment' }
      ]
    },
    biggestChallenge: {
      question: 'What\'s your biggest challenge with sleep right now?',
      placeholder: 'e.g., "Falling asleep" or "Staying asleep through the night"',
      examples: [
        'Falling asleep',
        'Staying asleep through the night',
        'Waking up too early',
        'Feeling tired during the day',
        'Sleep anxiety'
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

// Condition-specific goal mappings for more targeted goals
const CONDITION_SPECIFIC_GOALS: Record<string, string[]> = {
  'Diabetes': [
    'Lower my blood sugar levels',
    'Understand my medications',
    'Plan diabetes-friendly meals',
    'Learn to monitor glucose levels',
    'Manage complications',
    'Feel more confident in managing my day'
  ],
  'Heart & Blood Pressure': [
    'Lower my blood pressure',
    'Understand my heart medications',
    'Plan heart-healthy meals',
    'Learn to monitor my blood pressure',
    'Reduce my risk of heart disease',
    'Feel more confident about my heart health'
  ],
  'Respiratory (Asthma/COPD)': [
    'Breathe easier with my condition',
    'Master proper inhaler technique',
    'Recognize and manage asthma triggers',
    'Know when to use my rescue inhaler',
    'Exercise safely with breathing problems',
    'Feel confident managing my breathing'
  ],
  'Digestive / Gut Health': [
    'Improve my digestive symptoms',
    'Plan gut-friendly meals',
    'Understand my digestive medications',
    'Identify food triggers',
    'Manage stress and digestion',
    'Feel more comfortable with my gut health'
  ],
  'Insulin & Diabetes Medicines': [
    'Master proper injection technique',
    'Reduce injection pain and discomfort',
    'Learn about injection site rotation',
    'Handle injection emergencies',
    'Feel confident with insulin management',
    'Optimize my insulin timing'
  ],
  'Inhalers (Asthma/COPD)': [
    'Master proper inhaler technique',
    'Learn different types of inhalers',
    'Understand when to use each inhaler',
    'Reduce inhaler anxiety and build confidence',
    'Know how to clean and maintain my inhaler',
    'Feel confident using my inhaler in public'
  ],
  'Blood-Pressure Medicines': [
    'Understand how my blood pressure medications work',
    'Learn proper medication timing',
    'Recognize and manage side effects',
    'Know when to call my doctor',
    'Feel confident managing my blood pressure',
    'Optimize my medication routine'
  ],
  'Cholesterol Medicines (Statins)': [
    'Understand how statins work',
    'Learn about statin side effects',
    'Know when to take my statin',
    'Understand drug interactions',
    'Feel confident with my cholesterol management',
    'Monitor my cholesterol levels effectively'
  ],
  'Anxiety & Panic': [
    'Manage anxiety and panic attacks',
    'Learn breathing and relaxation techniques',
    'Understand my anxiety triggers',
    'Build confidence in stressful situations',
    'Develop healthy coping strategies',
    'Feel more in control of my anxiety'
  ],
  'Depression': [
    'Understand and manage my depression',
    'Learn mood regulation strategies',
    'Build healthy daily routines',
    'Know when to seek additional help',
    'Develop positive thinking patterns',
    'Feel more hopeful about my future'
  ],
  'Stress & Coping': [
    'Develop effective stress management',
    'Learn healthy coping mechanisms',
    'Balance work and personal life',
    'Build resilience to stress',
    'Create a sustainable stress management routine',
    'Feel more in control of my stress'
  ],
  'Sleep Health': [
    'Improve my sleep quality',
    'Establish healthy sleep routines',
    'Manage sleep-related anxiety',
    'Understand the connection between sleep and health',
    'Create a relaxing bedtime routine',
    'Feel more rested and energized'
  ],
  'Dental Procedure / Extraction': [
    'Prepare properly for my dental procedure',
    'Manage pre-procedure anxiety',
    'Understand what to expect during the procedure',
    'Learn proper post-procedure care',
    'Manage pain and discomfort after the procedure',
    'Follow diet restrictions correctly'
  ],
  'Endoscopy / Colonoscopy': [
    'Prepare properly for my endoscopy',
    'Follow pre-procedure diet guidelines',
    'Understand what to expect during the procedure',
    'Learn about post-procedure recovery',
    'Manage any discomfort after the procedure',
    'Understand my test results'
  ],
  'Day Surgery (Outpatient)': [
    'Prepare for my day surgery',
    'Follow pre-surgery instructions',
    'Understand the recovery process',
    'Manage post-surgery pain',
    'Know when to call my doctor',
    'Return to normal activities safely'
  ],
  'Imaging (CT/MRI/X-ray)': [
    'Prepare properly for my imaging test',
    'Understand what the test involves',
    'Manage anxiety about the procedure',
    'Know how to prepare my body',
    'Understand my test results',
    'Follow post-procedure instructions'
  ]
};

// Function to generate dynamic Step 4 goals based on user's previous choices
export const generateDynamicGoals = (
  healthGoal: string,
  condition: string,
  knowledgeLevel: string,
  mainInterests: string[]
): string[] => {
  // First, try to get condition-specific goals
  const conditionGoals = CONDITION_SPECIFIC_GOALS[condition];
  if (conditionGoals) {
    return conditionGoals;
  }

  // Fallback to dynamic goals based on health goal
  const dynamicGoals = DYNAMIC_STEP4_GOALS[healthGoal];
  
  if (!dynamicGoals) {
    // Final fallback to legacy goals
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    return DEFAULT_CONDITION_GOALS[conditionKey] || DEFAULT_CONDITION_GOALS['diabetes'];
  }

  // Start with knowledge level goals
  const knowledgeGoals = dynamicGoals.knowledgeLevel[knowledgeLevel] || [];
  
  // Add goals based on main interests (limit to 2 most relevant)
  const interestGoals: string[] = [];
  mainInterests.slice(0, 2).forEach(interest => {
    const goals = dynamicGoals.mainInterests[interest] || [];
    interestGoals.push(...goals.slice(0, 2)); // Take top 2 from each interest
  });
  
  // Add health goal specific goals
  const healthGoalOptions = dynamicGoals.healthGoal[healthGoal] || [];
  
  // Combine and deduplicate
  const allGoals = [...knowledgeGoals, ...interestGoals, ...healthGoalOptions];
  const uniqueGoals = Array.from(new Set(allGoals));
  
  // Limit to 6 goals total and add "Other..." option
  const finalGoals = uniqueGoals.slice(0, 5);
  if (!finalGoals.includes('Other...')) {
    finalGoals.push('Other...');
  }
  return finalGoals;
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