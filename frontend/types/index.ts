// User related types
export interface User {
  id: number;
  full_name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  health_goals: string[];
  created_at: string;
  updated_at: string;
}

// Health goals options
export type HealthGoal = 
  | 'Managing a condition (e.g., Diabetes, Heart Health)'
  | 'Preparing for a procedure (e.g., Endoscopy, Surgery)'
  | 'Improving overall wellness'
  | "I'm a caregiver or family member";

// Condition types
export interface Condition {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export type ConditionName = 'Diabetes' | 'Heart Health' | 'Pre-Procedure Prep' | 'Mental Wellness';

// Medication types
export interface Medication {
  id: number;
  name: string;
  description: string;
  condition_category: string;
}

// User session data
export interface UserSession {
  id: number;
  user_id: number;
  condition_selected: string;
  diagnosis_year?: number;
  takes_medication: boolean;
  medications?: string[];
  checks_vitals: 'Yes, regularly' | 'Yes, occasionally' | 'No';
  main_goal?: string;
  main_question?: string;
  ai_response?: string;
  created_at: string;
  // User data joined
  full_name?: string;
  gender?: string;
  age?: number;
  health_goals?: string[];
}

// Step 1 form data
export interface Step1FormData {
  full_name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  health_goals: HealthGoal[];
}

// Step 3 form data (quiz)
export interface Step3FormData {
  diagnosis_year?: number;
  takes_medication: boolean;
  medications: string[];
  checks_vitals: 'Yes, regularly' | 'Yes, occasionally' | 'No';
}

// Step 4 form data (goals and questions)
export interface Step4FormData {
  main_goal: string;
  main_question?: string;
}

// Dashboard card content
export interface DashboardContent {
  diagnosis_basics: string;
  nutrition_carbs: string;
  workout: string;
  daily_plan: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserCreateResponse {
  success: boolean;
  user_id: number;
  message: string;
}

export interface SessionCreateResponse {
  success: boolean;
  session_id: number;
  message: string;
}

export interface DashboardResponse {
  success: boolean;
  dashboard: DashboardContent;
  user_context: {
    name: string;
    condition: string;
    main_goal?: string;
  };
  note?: string;
}