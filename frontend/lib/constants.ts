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
// Dynamic Dashboard Card System
export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: number; // 1 = highest priority, 5 = lowest
  contentKey: string; // Key used to store content in backend response
}

// Card templates for different conditions and scenarios
export const CARD_TEMPLATES: Record<string, DashboardCard[]> = {
  // Medication-focused cards
  'Inhalers (Asthma/COPD)': [
    { id: 'inhaler_technique', title: 'Inhaler Technique Guide', description: 'Step-by-step instructions for proper inhaler use', icon: '🌬️', priority: 1, contentKey: 'inhaler_technique' },
    { id: 'inhaler_types', title: 'Types of Inhalers', description: 'Understanding different inhaler medications and devices', icon: '💊', priority: 2, contentKey: 'inhaler_types' },
    { id: 'breathing_exercises', title: 'Breathing Exercises', description: 'Techniques to improve lung function and breathing', icon: '🫁', priority: 3, contentKey: 'breathing_exercises' },
    { id: 'emergency_care', title: 'Emergency Care', description: 'When to seek help and emergency inhaler use', icon: '🚨', priority: 4, contentKey: 'emergency_care' },
    { id: 'daily_management', title: 'Daily Management', description: 'Building a consistent asthma/COPD routine', icon: '📅', priority: 5, contentKey: 'daily_management' }
  ],
  'Insulin & Diabetes Medicines': [
    { id: 'injection_technique', title: 'Injection Technique', description: 'Proper insulin injection methods and site rotation', icon: '💉', priority: 1, contentKey: 'injection_technique' },
    { id: 'medication_timing', title: 'Medication Timing', description: 'When and how to take diabetes medications', icon: '⏰', priority: 2, contentKey: 'medication_timing' },
    { id: 'blood_sugar_monitoring', title: 'Blood Sugar Monitoring', description: 'How to check and track your blood glucose levels', icon: '🩸', priority: 3, contentKey: 'blood_sugar_monitoring' },
    { id: 'meal_planning', title: 'Meal Planning', description: 'Diabetes-friendly nutrition and carb counting', icon: '🥗', priority: 4, contentKey: 'meal_planning' },
    { id: 'medication_safety', title: 'Medication Safety', description: 'Storage, side effects, and safety tips', icon: '🛡️', priority: 5, contentKey: 'medication_safety' }
  ],
  'Blood-Pressure Medicines': [
    { id: 'medication_management', title: 'Medication Management', description: 'Understanding and managing your BP medications', icon: '💊', priority: 1, contentKey: 'medication_management' },
    { id: 'home_monitoring', title: 'Home Monitoring', description: 'How to check your blood pressure at home', icon: '🩺', priority: 2, contentKey: 'home_monitoring' },
    { id: 'lifestyle_changes', title: 'Lifestyle Changes', description: 'Diet, exercise, and habits for better blood pressure', icon: '🏃', priority: 3, contentKey: 'lifestyle_changes' },
    { id: 'side_effects', title: 'Managing Side Effects', description: 'Understanding and managing medication side effects', icon: '⚠️', priority: 4, contentKey: 'side_effects' },
    { id: 'daily_routine', title: 'Daily Routine', description: 'Building a heart-healthy daily routine', icon: '📅', priority: 5, contentKey: 'daily_routine' }
  ],
  'Cholesterol Medicines (Statins)': [
    { id: 'medication_understanding', title: 'Understanding Statins', description: 'How cholesterol medications work in your body', icon: '🧬', priority: 1, contentKey: 'medication_understanding' },
    { id: 'side_effects_management', title: 'Managing Side Effects', description: 'Coping with muscle pain and other statin side effects', icon: '💪', priority: 2, contentKey: 'side_effects_management' },
    { id: 'diet_nutrition', title: 'Heart-Healthy Diet', description: 'Foods that help lower cholesterol naturally', icon: '🥗', priority: 3, contentKey: 'diet_nutrition' },
    { id: 'exercise_benefits', title: 'Exercise Benefits', description: 'Physical activity for cholesterol management', icon: '🏃', priority: 4, contentKey: 'exercise_benefits' },
    { id: 'monitoring_progress', title: 'Monitoring Progress', description: 'Tracking your cholesterol and medication effectiveness', icon: '📊', priority: 5, contentKey: 'monitoring_progress' }
  ],
  // Procedure-focused cards
  'Endoscopy / Colonoscopy': [
    { id: 'preparation_guide', title: 'Preparation Guide', description: 'Step-by-step preparation instructions', icon: '📋', priority: 1, contentKey: 'preparation_guide' },
    { id: 'what_to_expect', title: 'What to Expect', description: 'Understanding the procedure process', icon: '🔍', priority: 2, contentKey: 'what_to_expect' },
    { id: 'recovery_tips', title: 'Recovery Tips', description: 'Post-procedure care and recovery', icon: '🏥', priority: 3, contentKey: 'recovery_tips' },
    { id: 'diet_restrictions', title: 'Diet Restrictions', description: 'Pre and post-procedure dietary guidelines', icon: '🍽️', priority: 4, contentKey: 'diet_restrictions' },
    { id: 'anxiety_management', title: 'Managing Anxiety', description: 'Coping strategies for procedure anxiety', icon: '😌', priority: 5, contentKey: 'anxiety_management' }
  ],
  'Day Surgery (Outpatient)': [
    { id: 'pre_surgery_prep', title: 'Pre-Surgery Preparation', description: 'Getting ready for your outpatient procedure', icon: '🏥', priority: 1, contentKey: 'pre_surgery_prep' },
    { id: 'surgery_day', title: 'Surgery Day', description: 'What to expect on the day of surgery', icon: '⚕️', priority: 2, contentKey: 'surgery_day' },
    { id: 'recovery_guide', title: 'Recovery Guide', description: 'Post-surgery care and healing process', icon: '🩹', priority: 3, contentKey: 'recovery_guide' },
    { id: 'pain_management', title: 'Pain Management', description: 'Managing discomfort after surgery', icon: '💊', priority: 4, contentKey: 'pain_management' },
    { id: 'follow_up_care', title: 'Follow-up Care', description: 'Post-surgery appointments and monitoring', icon: '📅', priority: 5, contentKey: 'follow_up_care' }
  ],
  'Imaging (CT/MRI/X-ray)': [
    { id: 'test_preparation', title: 'Test Preparation', description: 'How to prepare for your imaging test', icon: '📷', priority: 1, contentKey: 'test_preparation' },
    { id: 'what_to_expect', title: 'What to Expect', description: 'Understanding the imaging process', icon: '🔬', priority: 2, contentKey: 'what_to_expect' },
    { id: 'safety_concerns', title: 'Safety Information', description: 'Understanding radiation and safety considerations', icon: '🛡️', priority: 3, contentKey: 'safety_concerns' },
    { id: 'results_understanding', title: 'Understanding Results', description: 'How to interpret your imaging results', icon: '📊', priority: 4, contentKey: 'results_understanding' },
    { id: 'follow_up', title: 'Follow-up Care', description: 'Next steps after your imaging test', icon: '📅', priority: 5, contentKey: 'follow_up' }
  ],
  'Dental Procedure / Extraction': [
    { id: 'pre_procedure_prep', title: 'Pre-Procedure Preparation', description: 'Getting ready for your dental procedure', icon: '🦷', priority: 1, contentKey: 'pre_procedure_prep' },
    { id: 'procedure_day', title: 'Procedure Day', description: 'What to expect during your dental procedure', icon: '⚕️', priority: 2, contentKey: 'procedure_day' },
    { id: 'recovery_care', title: 'Recovery Care', description: 'Post-procedure care and healing', icon: '🩹', priority: 3, contentKey: 'recovery_care' },
    { id: 'pain_management', title: 'Pain Management', description: 'Managing discomfort after dental work', icon: '💊', priority: 4, contentKey: 'pain_management' },
    { id: 'oral_hygiene', title: 'Oral Hygiene', description: 'Maintaining good oral health after procedure', icon: '🧼', priority: 5, contentKey: 'oral_hygiene' }
  ],
  // Psychological health cards
  'Anxiety & Panic': [
    { id: 'breathing_techniques', title: 'Breathing Techniques', description: 'Calming exercises for anxiety and panic attacks', icon: '🫁', priority: 1, contentKey: 'breathing_techniques' },
    { id: 'panic_attack_management', title: 'Panic Attack Management', description: 'Coping strategies for panic attacks', icon: '😰', priority: 2, contentKey: 'panic_attack_management' },
    { id: 'anxiety_triggers', title: 'Managing Triggers', description: 'Identifying and managing anxiety triggers', icon: '🎯', priority: 3, contentKey: 'anxiety_triggers' },
    { id: 'coping_strategies', title: 'Coping Strategies', description: 'Healthy ways to manage anxiety daily', icon: '🧘', priority: 4, contentKey: 'coping_strategies' },
    { id: 'when_to_seek_help', title: 'When to Seek Help', description: 'Recognizing when to get professional support', icon: '🆘', priority: 5, contentKey: 'when_to_seek_help' }
  ],
  'Depression': [
    { id: 'mood_regulation', title: 'Mood Regulation', description: 'Strategies for managing depression and mood', icon: '😔', priority: 1, contentKey: 'mood_regulation' },
    { id: 'daily_routines', title: 'Daily Routines', description: 'Building healthy daily habits for depression', icon: '📅', priority: 2, contentKey: 'daily_routines' },
    { id: 'medication_understanding', title: 'Understanding Medications', description: 'How depression medications work and their effects', icon: '💊', priority: 3, contentKey: 'medication_understanding' },
    { id: 'therapy_approaches', title: 'Therapy Approaches', description: 'Understanding different therapy and counseling methods', icon: '💬', priority: 4, contentKey: 'therapy_approaches' },
    { id: 'support_systems', title: 'Support Systems', description: 'Building and maintaining support networks', icon: '🤝', priority: 5, contentKey: 'support_systems' }
  ],
  'Stress & Coping': [
    { id: 'stress_management', title: 'Stress Management', description: 'Techniques for managing daily stress', icon: '🧘', priority: 1, contentKey: 'stress_management' },
    { id: 'relaxation_techniques', title: 'Relaxation Techniques', description: 'Methods for relaxation and stress relief', icon: '😌', priority: 2, contentKey: 'relaxation_techniques' },
    { id: 'time_management', title: 'Time Management', description: 'Organizing your time to reduce stress', icon: '⏰', priority: 3, contentKey: 'time_management' },
    { id: 'work_life_balance', title: 'Work-Life Balance', description: 'Maintaining healthy boundaries and balance', icon: '⚖️', priority: 4, contentKey: 'work_life_balance' },
    { id: 'healthy_coping', title: 'Healthy Coping', description: 'Building positive coping mechanisms', icon: '💪', priority: 5, contentKey: 'healthy_coping' }
  ],
  'Sleep Health': [
    { id: 'sleep_hygiene', title: 'Sleep Hygiene', description: 'Creating healthy sleep habits and routines', icon: '😴', priority: 1, contentKey: 'sleep_hygiene' },
    { id: 'sleep_disorders', title: 'Understanding Sleep Issues', description: 'Common sleep problems and their causes', icon: '🌙', priority: 2, contentKey: 'sleep_disorders' },
    { id: 'medication_alternatives', title: 'Sleep Solutions', description: 'Natural and medical approaches to better sleep', icon: '💊', priority: 3, contentKey: 'medication_alternatives' },
    { id: 'lifestyle_factors', title: 'Lifestyle Factors', description: 'How daily habits affect your sleep', icon: '🏃', priority: 4, contentKey: 'lifestyle_factors' },
    { id: 'sleep_environment', title: 'Sleep Environment', description: 'Creating the perfect sleep environment', icon: '🛏️', priority: 5, contentKey: 'sleep_environment' }
  ],
  // General education cards
  'Diabetes': [
    { id: 'blood_sugar_basics', title: 'Blood Sugar Basics', description: 'Understanding glucose levels and diabetes management', icon: '🩸', priority: 1, contentKey: 'blood_sugar_basics' },
    { id: 'meal_planning', title: 'Meal Planning', description: 'Diabetes-friendly nutrition and carb counting', icon: '🥗', priority: 2, contentKey: 'meal_planning' },
    { id: 'exercise_guidelines', title: 'Exercise Guidelines', description: 'Safe physical activity with diabetes', icon: '🏃', priority: 3, contentKey: 'exercise_guidelines' },
    { id: 'medication_management', title: 'Medication Management', description: 'Understanding your diabetes medications', icon: '💊', priority: 4, contentKey: 'medication_management' },
    { id: 'daily_plan', title: 'Plan Your Day', description: 'Daily management checklist and tips', icon: '📅', priority: 5, contentKey: 'daily_plan' }
  ],
  'Heart & Blood Pressure': [
    { id: 'heart_health_basics', title: 'Heart Health Basics', description: 'Understanding cardiovascular health and blood pressure', icon: '❤️', priority: 1, contentKey: 'heart_health_basics' },
    { id: 'heart_healthy_diet', title: 'Heart-Healthy Diet', description: 'Nutrition for cardiovascular health', icon: '🥗', priority: 2, contentKey: 'heart_healthy_diet' },
    { id: 'safe_exercise', title: 'Safe Exercise', description: 'Physical activity guidelines for heart health', icon: '🏃', priority: 3, contentKey: 'safe_exercise' },
    { id: 'stress_management', title: 'Stress Management', description: 'Managing stress for better heart health', icon: '🧘', priority: 4, contentKey: 'stress_management' },
    { id: 'daily_plan', title: 'Plan Your Day', description: 'Daily management checklist and tips', icon: '📅', priority: 5, contentKey: 'daily_plan' }
  ],
  'Respiratory (Asthma/COPD)': [
    { id: 'breathing_techniques', title: 'Breathing Techniques', description: 'Exercises to improve lung function', icon: '🫁', priority: 1, contentKey: 'breathing_techniques' },
    { id: 'inhaler_use', title: 'Inhaler Use', description: 'Proper technique for respiratory medications', icon: '🌬️', priority: 2, contentKey: 'inhaler_use' },
    { id: 'trigger_management', title: 'Trigger Management', description: 'Identifying and avoiding breathing triggers', icon: '🎯', priority: 3, contentKey: 'trigger_management' },
    { id: 'exercise_guidelines', title: 'Exercise Guidelines', description: 'Safe physical activity with breathing conditions', icon: '🏃', priority: 4, contentKey: 'exercise_guidelines' },
    { id: 'daily_plan', title: 'Plan Your Day', description: 'Daily management checklist and tips', icon: '📅', priority: 5, contentKey: 'daily_plan' }
  ],
  'Digestive / Gut Health': [
    { id: 'digestive_basics', title: 'Digestive Health Basics', description: 'Understanding your digestive system', icon: '🥗', priority: 1, contentKey: 'digestive_basics' },
    { id: 'food_choices', title: 'Food Choices', description: 'Foods that help or hurt your digestion', icon: '🍽️', priority: 2, contentKey: 'food_choices' },
    { id: 'symptom_tracking', title: 'Symptom Tracking', description: 'Monitoring and understanding digestive symptoms', icon: '📊', priority: 3, contentKey: 'symptom_tracking' },
    { id: 'lifestyle_factors', title: 'Lifestyle Factors', description: 'Stress, sleep, and other factors affecting digestion', icon: '🏃', priority: 4, contentKey: 'lifestyle_factors' },
    { id: 'daily_plan', title: 'Plan Your Day', description: 'Daily management checklist and tips', icon: '📅', priority: 5, contentKey: 'daily_plan' }
  ]
};

// Legacy static cards for backward compatibility
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

// Function to generate dynamic cards based on user data
export const generateDashboardCards = (
  selectedCondition: string,
  healthGoals: string[],
  knowledgeLevel: string,
  mainInterests: string[],
  mainGoals: string[],
  learningStyle?: string
): DashboardCard[] => {
  // Get base cards for the selected condition
  const baseCards = CARD_TEMPLATES[selectedCondition] || [];
  
  if (baseCards.length === 0) {
    // Fallback to legacy cards if condition not found
    return DASHBOARD_CARDS.map(card => ({
      ...card,
      priority: 3,
      contentKey: card.id
    }));
  }
  
  // Filter cards based on user's main interests and goals
  const relevantCards = baseCards.filter(card => {
    const cardKeywords = card.title.toLowerCase() + ' ' + card.description.toLowerCase();
    
    // Ensure mainInterests and mainGoals are arrays
    const interestsArray = Array.isArray(mainInterests) ? mainInterests : (mainInterests ? [mainInterests] : []);
    const goalsArray = Array.isArray(mainGoals) ? mainGoals : (mainGoals ? [mainGoals] : []);
    
    const userInterests = interestsArray.join(' ').toLowerCase();
    const userGoals = goalsArray.join(' ').toLowerCase();
    
    // Include card if it matches user interests, goals, or is high priority
    return cardKeywords.includes(userInterests) || 
           cardKeywords.includes(userGoals) || 
           card.priority <= 3; // Always include high priority cards
  });
  
  // Sort by priority (lower number = higher priority) and limit to 5 cards
  const sortedCards = relevantCards
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
  
  // If we have fewer than 2 cards, add some high-priority cards
  if (sortedCards.length < 2) {
    const additionalCards = baseCards
      .filter(card => !sortedCards.some(selected => selected.id === card.id))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 2 - sortedCards.length);
    
    sortedCards.push(...additionalCards);
  }
  
  return sortedCards;
};

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
      question: 'What aspects of diabetes management do you feel most confident about?',
      options: [
        { value: 'blood_sugar', label: 'I understand blood sugar monitoring and control' },
        { value: 'diet', label: 'I know how to eat right and plan diabetes-friendly meals' },
        { value: 'exercise', label: 'I understand safe exercise and physical activity with diabetes' },
        { value: 'medications', label: 'I know my diabetes medications and how they work' },
        { value: 'daily_life', label: 'I can manage diabetes in my daily life' },
        { value: 'complications', label: 'I understand how to prevent diabetes complications' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about diabetes' },
        { value: 'other', label: 'Other - I have specific knowledge about diabetes (please specify)' }
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
      question: 'What aspects of heart health management do you feel most confident about?',
      options: [
        { value: 'blood_pressure', label: 'I understand blood pressure and what the numbers mean' },
        { value: 'heart_healthy_diet', label: 'I know heart-healthy eating and meal planning' },
        { value: 'safe_exercise', label: 'I understand safe exercise for heart health' },
        { value: 'medications', label: 'I know my heart medications and how they work' },
        { value: 'stress', label: 'I understand how stress affects my heart health' },
        { value: 'warning_signs', label: 'I can recognize heart health warning signs' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about heart health' },
        { value: 'other', label: 'Other - I have specific knowledge about heart health (please specify)' }
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
      question: 'What aspects of managing your breathing condition do you feel most confident about?',
      options: [
        { value: 'how_condition_works', label: 'I understand how asthma/COPD affects my lungs and airways' },
        { value: 'breathing_science', label: 'I know the science behind breathing difficulties' },
        { value: 'trigger_causes', label: 'I understand why certain things trigger breathing problems' },
        { value: 'medication_types', label: 'I know the different types of breathing medications and what they do' },
        { value: 'exercise_physiology', label: 'I understand how exercise affects my breathing condition' },
        { value: 'emergency_signs', label: 'I can recognize warning signs that require emergency care' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about breathing conditions' },
        { value: 'other', label: 'Other - I have specific knowledge about breathing conditions (please specify)' }
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
      question: 'What aspects of digestive health management do you feel most confident about?',
      options: [
        { value: 'diet', label: 'I know which foods help or hurt my digestion' },
        { value: 'symptoms', label: 'I understand my digestive symptoms and what they mean' },
        { value: 'medications', label: 'I know how to manage my digestive medications' },
        { value: 'lifestyle', label: 'I understand lifestyle changes for better digestion' },
        { value: 'stress', label: 'I know how stress affects my digestion' },
        { value: 'when_to_see_doctor', label: 'I know when to see a doctor for digestive issues' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about digestive health' },
        { value: 'other', label: 'Other - I have specific knowledge about digestive health (please specify)' }
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
      question: 'What aspects of diabetes medication management do you feel most confident about?',
      options: [
        { value: 'how_work', label: 'I understand how insulin and diabetes medicines work in my body' },
        { value: 'medication_types', label: 'I know the different types of diabetes medications and their purposes' },
        { value: 'why_timing', label: 'I understand why timing matters for blood sugar control' },
        { value: 'storage_science', label: 'I know the proper way to store my medications' },
        { value: 'side_effects', label: 'I understand side effects and their causes' },
        { value: 'emergency_signs', label: 'I can recognize emergency warning signs' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about diabetes medications' },
        { value: 'other', label: 'Other - I have specific knowledge about diabetes medications (please specify)' }
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
      question: 'What aspects of inhaler use do you feel most confident about?',
      options: [
        { value: 'how_work', label: 'I understand how inhalers deliver medicine to my lungs' },
        { value: 'medication_types', label: 'I know the different types of inhaler medications' },
        { value: 'why_timing', label: 'I understand why timing and frequency matter' },
        { value: 'storage_safety', label: 'I know how to store and handle inhalers safely' },
        { value: 'side_effects', label: 'I understand side effects and when to be concerned' },
        { value: 'when_emergency', label: 'I know when to seek emergency help vs. using my inhaler' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about inhaler use' },
        { value: 'other', label: 'Other - I have specific knowledge about inhaler use (please specify)' }
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
      question: 'What aspects of blood pressure medication management do you feel most confident about?',
      options: [
        { value: 'how_work', label: 'I understand how blood pressure medications work in my body' },
        { value: 'medication_types', label: 'I know the different types of BP medications and why they\'re prescribed' },
        { value: 'side_effects_why', label: 'I understand why side effects happen and what they mean' },
        { value: 'interactions', label: 'I know how medications interact with food and other drugs' },
        { value: 'bp_numbers', label: 'I understand blood pressure numbers and what they mean' },
        { value: 'emergency_signs', label: 'I can recognize dangerous blood pressure levels' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about blood pressure medications' },
        { value: 'other', label: 'Other - I have specific knowledge about blood pressure medications (please specify)' }
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
      question: 'What aspects of cholesterol medication management do you feel most confident about?',
      options: [
        { value: 'how_work', label: 'I understand how statins lower cholesterol in my body' },
        { value: 'cholesterol_types', label: 'I know the different types of cholesterol (HDL, LDL, triglycerides)' },
        { value: 'why_timing', label: 'I understand why timing matters for statin effectiveness' },
        { value: 'side_effects_causes', label: 'I know why muscle pain and other side effects occur' },
        { value: 'interactions', label: 'I understand how statins interact with food and other drugs' },
        { value: 'long_term', label: 'I know the long-term benefits and what to expect' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about cholesterol medications' },
        { value: 'other', label: 'Other - I have specific knowledge about cholesterol medications (please specify)' }
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
      question: 'What aspects of your endoscopy procedure do you feel most confident about?',
      options: [
        { value: 'preparation', label: 'I understand the pre-procedure preparation steps' },
        { value: 'what_to_expect', label: 'I know what to expect during the procedure' },
        { value: 'recovery', label: 'I understand the recovery process and timeline' },
        { value: 'diet_restrictions', label: 'I know the diet restrictions and changes needed' },
        { value: 'medication_adjustments', label: 'I understand what medication adjustments are needed' },
        { value: 'results', label: 'I know how to understand my results' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about endoscopy procedures' },
        { value: 'other', label: 'Other - I have specific knowledge about endoscopy procedures (please specify)' }
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
      question: 'What aspects of your outpatient surgery do you feel most confident about?',
      options: [
        { value: 'preparation', label: 'I understand the pre-surgery preparation requirements' },
        { value: 'surgery_day', label: 'I know what to expect on surgery day' },
        { value: 'recovery', label: 'I understand the post-surgery recovery process' },
        { value: 'pain_management', label: 'I know how to manage pain after surgery' },
        { value: 'activity_restrictions', label: 'I understand activity restrictions and limitations' },
        { value: 'follow_up', label: 'I know about follow-up care and appointments' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about outpatient surgery' },
        { value: 'other', label: 'Other - I have specific knowledge about outpatient surgery (please specify)' }
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
      question: 'What aspects of your imaging test do you feel most confident about?',
      options: [
        { value: 'preparation', label: 'I understand the pre-test preparation requirements' },
        { value: 'what_to_expect', label: 'I know what to expect during the test' },
        { value: 'safety', label: 'I understand safety considerations and concerns' },
        { value: 'results', label: 'I know how to understand my test results' },
        { value: 'follow_up', label: 'I understand follow-up procedures if needed' },
        { value: 'cost', label: 'I know about cost and insurance coverage' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about imaging tests' },
        { value: 'other', label: 'Other - I have specific knowledge about imaging tests (please specify)' }
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
      question: 'What aspects of your dental procedure do you feel most confident about?',
      options: [
        { value: 'preparation', label: 'I understand the pre-procedure preparation requirements' },
        { value: 'what_to_expect', label: 'I know what to expect during the procedure' },
        { value: 'recovery', label: 'I understand post-procedure care and recovery' },
        { value: 'pain_management', label: 'I know how to manage pain and discomfort' },
        { value: 'diet_modifications', label: 'I understand diet modifications after the procedure' },
        { value: 'healing', label: 'I know the healing timeline and what to expect' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about dental procedures' },
        { value: 'other', label: 'Other - I have specific knowledge about dental procedures (please specify)' }
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
      question: 'What aspects of managing anxiety do you feel most confident about?',
      options: [
        { value: 'breathing_techniques', label: 'I know breathing and relaxation techniques' },
        { value: 'panic_attacks', label: 'I understand how to manage panic attacks' },
        { value: 'triggers', label: 'I can identify and manage my anxiety triggers' },
        { value: 'coping_strategies', label: 'I know healthy coping strategies' },
        { value: 'medication', label: 'I understand my anxiety medications' },
        { value: 'lifestyle', label: 'I know lifestyle changes for anxiety management' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about anxiety management' },
        { value: 'other', label: 'Other - I have specific knowledge about anxiety management (please specify)' }
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
      question: 'What aspects of managing depression do you feel most confident about?',
      options: [
        { value: 'mood_regulation', label: 'I know mood regulation strategies' },
        { value: 'daily_routines', label: 'I understand how to build healthy daily routines' },
        { value: 'medication', label: 'I understand my depression medications' },
        { value: 'therapy', label: 'I know about therapy and counseling approaches' },
        { value: 'lifestyle', label: 'I understand lifestyle changes for depression' },
        { value: 'support_systems', label: 'I know how to build support systems' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about depression management' },
        { value: 'other', label: 'Other - I have specific knowledge about depression management (please specify)' }
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
      question: 'What aspects of stress management do you feel most confident about?',
      options: [
        { value: 'relaxation_techniques', label: 'I know relaxation techniques' },
        { value: 'time_management', label: 'I understand time management and organization' },
        { value: 'work_life_balance', label: 'I know how to maintain work-life balance' },
        { value: 'mindfulness', label: 'I understand mindfulness and meditation' },
        { value: 'physical_activity', label: 'I know how physical activity helps with stress relief' },
        { value: 'coping_skills', label: 'I know healthy coping skills' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about stress management' },
        { value: 'other', label: 'Other - I have specific knowledge about stress management (please specify)' }
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
      question: 'What aspects of sleep health management do you feel most confident about?',
      options: [
        { value: 'sleep_hygiene', label: 'I know sleep hygiene and routines' },
        { value: 'sleep_disorders', label: 'I understand sleep disorders' },
        { value: 'medication', label: 'I know about sleep medications and alternatives' },
        { value: 'lifestyle', label: 'I understand lifestyle changes for better sleep' },
        { value: 'stress_sleep', label: 'I know how to manage stress and sleep' },
        { value: 'environment', label: 'I understand how to create a sleep-friendly environment' },
        { value: 'none', label: 'None of the above - I\'m just starting to learn about sleep health' },
        { value: 'other', label: 'Other - I have specific knowledge about sleep health (please specify)' }
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