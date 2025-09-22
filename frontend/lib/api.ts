import axios from 'axios';
import { 
  User, 
  UserSession, 
  Condition, 
  Medication, 
  Step1FormData, 
  Step3FormData, 
  Step4FormData,
  UserCreateResponse,
  SessionCreateResponse,
  DashboardResponse,
  ApiResponse,
  VoiceCard,
  VoiceProfile,
  VoiceSessionResponse,
  TTSSummaryResponse,
  VoiceCardsResponse,
  VoiceProfileResponse
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API functions
export const userApi = {
  // Create a new user
  create: async (userData: Step1FormData): Promise<UserCreateResponse> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Get user by ID
  getById: async (userId: number): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create or update user session
  createSession: async (
    userId: number, 
    sessionData: { condition_selected: string } & Partial<Step3FormData & Step4FormData>
  ): Promise<SessionCreateResponse> => {
    const response = await api.post(`/users/${userId}/session`, sessionData);
    return response.data;
  },

  // Get user session
  getSession: async (userId: number): Promise<UserSession> => {
    const response = await api.get(`/users/${userId}/session`);
    return response.data;
  },
};

// Conditions API functions
export const conditionsApi = {
  // Get all conditions
  getAll: async (): Promise<Condition[]> => {
    const response = await api.get('/conditions');
    return response.data;
  },

  // Get specific condition
  getByName: async (name: string): Promise<Condition> => {
    const response = await api.get(`/conditions/${name}`);
    return response.data;
  },

  // Get condition-specific goals
  getGoals: async (conditionName: string): Promise<{ condition: string; goals: string[] }> => {
    const response = await api.get(`/conditions/${conditionName}/goals`);
    return response.data;
  },
};

// Medications API functions
export const medicationsApi = {
  // Get all medications
  getAll: async (condition?: string): Promise<Medication[]> => {
    const params = condition ? { condition } : {};
    const response = await api.get('/medications', { params });
    return response.data;
  },

  // Search medications
  search: async (query: string, condition?: string): Promise<Medication[]> => {
    const params = { q: query, ...(condition && { condition }) };
    const response = await api.get('/medications/search', { params });
    return response.data;
  },

  // Get medication by ID
  getById: async (medicationId: number): Promise<Medication> => {
    const response = await api.get(`/medications/${medicationId}`);
    return response.data;
  },
};

// AI API functions
export const aiApi = {
  // Generate dashboard content
  generateDashboard: async (userId: number): Promise<DashboardResponse> => {
    const response = await api.post('/ai/generate-dashboard', { user_id: userId });
    return response.data;
  },

  // Get saved dashboard content
  getDashboard: async (userId: number): Promise<DashboardResponse> => {
    const response = await api.get(`/ai/dashboard/${userId}`);
    return response.data;
  },
};

// Voice Coach API functions
export const voiceApi = {
  // Create voice session
  createSession: async (userId: number, lang: string = 'en'): Promise<VoiceSessionResponse> => {
    const response = await api.post('/voice/session', { user_id: userId, lang });
    return response.data;
  },

  // Get user's voice cards
  getCards: async (userId: number): Promise<VoiceCardsResponse> => {
    const response = await api.get(`/voice/cards/${userId}`);
    return response.data;
  },

  // Get user profile for voice coach
  getProfile: async (userId: number): Promise<VoiceProfileResponse> => {
    const response = await api.get(`/voice/profile/${userId}`);
    return response.data;
  },

  // Summarize card content to TTS (new OpenAI approach)
  summarizeCard: async (userId: number, cardId: string): Promise<TTSSummaryResponse> => {
    const response = await api.post('/voice/summarize-card-v2', { 
      user_id: userId, 
      card_id: cardId 
    });
    return response.data;
  },

  // Generate dashboard card audio (no session required)
  generateDashboardCardAudio: async (userId: number, cardId: string): Promise<TTSSummaryResponse> => {
    const response = await api.post('/voice/dashboard-card-audio', { 
      user_id: userId, 
      card_id: cardId 
    });
    return response.data;
  },

  // Get WebSocket URL for voice chat
  getWebSocketUrl: (): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl.replace('/api', '')}/api/voice/chat`;
  }
};

// Error handling helper
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
};

// Health check
export const healthCheck = async (): Promise<{ message: string }> => {
  const response = await api.get('/health');
  return response.data;
};

export default api;