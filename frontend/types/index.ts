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
  | 'Education about the condition (e.g., Diabetes, Heart Health)'
  | 'Preparing for a procedure (e.g., Endoscopy, Surgery)'
  | 'How to use my medication (e.g., Insulin injection, Asthma inhaler)'
  | 'Psychological health (panic attacks, anxiety management)';

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
  main_goal?: string[];
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

// Step 3 form data (learning discovery)
export interface Step3FormData {
  knowledge_level: 'new' | 'some' | 'experienced';
  main_interests: string[];
  other_knowledge?: string;
}

// Step 4 form data (goals and questions)
export interface Step4FormData {
  main_goal: string[];
  main_question?: string;
  learning_style?: 'quick_tips' | 'step_by_step' | 'videos';
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

// Voice Coach types
export interface VoiceCard {
  id: string;
  title: string;
  updated_at: string;
  duration_estimate: number;
  has_content: boolean;
}

export interface VoiceProfile {
  id: string;
  full_name: string;
  gender: string;
  age: number;
  health_goals: string[];
  condition_selected?: string;
  diagnosis_year?: number;
  takes_medication: boolean;
  medications: string[];
  checks_vitals?: string;
  main_goal?: string;
  main_question?: string;
}

export interface VoiceSessionResponse {
  success: boolean;
  session_id: string;
  message: string;
}

export interface TTSSummaryResponse {
  success: boolean;
  script_text: string;
  audio_url: string;
  duration_ms: number;
  cache_key: string;
  cached: boolean;
}

export interface VoiceCardsResponse {
  success: boolean;
  cards: VoiceCard[];
  user_context: {
    name: string;
    condition: string;
  };
}

export interface VoiceProfileResponse {
  success: boolean;
  profile: VoiceProfile;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  [key: string]: any;
}

export interface WSAudioChunk {
  type: 'audio_chunk';
  chunk_index: number;
  audio_data: string;
  is_final: boolean;
}

export interface WSTextResponse {
  type: 'answer_final';
  text: string;
  grounded: boolean;
  sources: string[];
}

export interface WSASRResult {
  type: 'asr_partial' | 'asr_final';
  transcript: string;
}