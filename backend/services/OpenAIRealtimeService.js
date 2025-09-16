const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class OpenAIRealtimeService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Create a realtime session token for the client
  async createRealtimeToken(userId, sessionId) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('Creating realtime session for user:', userId, 'session:', sessionId);
      
      // Return our proxy WebSocket URL (ChatGPT pattern)
      return {
        token: 'proxy', // We don't send the real token to client
        ws_url: `ws://localhost:6002/api/realtime/ws?user_id=${userId}&session_id=${sessionId}`,
        model: 'gpt-4o-realtime-preview-2024-10-01',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      };
    } catch (error) {
      console.error('Error creating realtime session:', error);
      throw new Error(`Failed to create realtime session: ${error.message}`);
    }
  }

  // Get user context for RAG grounding
  async getUserContext(userId, query) {
    try {
      // This will be called by the OpenAI Realtime model via function calling
      const context = await this.fetchUserContext(userId, query);
      
      return {
        dashboard_cards: context.dashboard || [],
        user_profile: context.profile || {},
        knowledge_base: context.kb_results || [],
        emergency_detected: this.detectEmergencyIntent(query)
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        dashboard_cards: [],
        user_profile: {},
        knowledge_base: [],
        emergency_detected: false,
        error: 'Failed to retrieve context'
      };
    }
  }

  // Fetch user context from database and KB
  async fetchUserContext(userId, query) {
    const db = require('../server').db;
    
    return new Promise((resolve, reject) => {
      // Get user profile and dashboard
      const profileQuery = `
        SELECT 
          u.full_name, u.gender, u.age, u.health_goals,
          us.condition_selected, us.diagnosis_year, us.takes_medication, 
          us.medications, us.checks_vitals, us.main_goal, us.main_question,
          dc.cards_data
        FROM users u
        LEFT JOIN user_sessions us ON u.id = us.user_id
        LEFT JOIN dashboard_content dc ON u.id = dc.user_id
        WHERE u.id = ?
      `;

      db.get(profileQuery, [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const profile = row ? {
          full_name: row.full_name,
          gender: row.gender,
          age: row.age,
          health_goals: row.health_goals,
          condition_selected: row.condition_selected,
          diagnosis_year: row.diagnosis_year,
          takes_medication: row.takes_medication,
          medications: row.medications ? row.medications.split(',') : [],
          checks_vitals: row.checks_vitals,
          main_goal: row.main_goal,
          main_question: row.main_question
        } : {};

        const dashboard = row && row.cards_data ? JSON.parse(row.cards_data) : [];

        // Simple KB search (in production, use vector similarity)
        const kbResults = this.searchKnowledgeBase(query);

        resolve({
          profile,
          dashboard,
          kb_results: kbResults
        });
      });
    });
  }

  // Simple knowledge base search
  searchKnowledgeBase(query) {
    // In production, this would be a vector similarity search
    const miniKB = [
      {
        topic: 'medication_timing',
        content: 'Take medications at the same time each day for best effectiveness.',
        relevance: 0.8
      },
      {
        topic: 'exercise_safety',
        content: 'Start with light exercise and gradually increase intensity. Consult your doctor before beginning any new exercise program.',
        relevance: 0.7
      },
      {
        topic: 'diet_basics',
        content: 'Focus on whole foods, lean proteins, and plenty of vegetables. Limit processed foods and added sugars.',
        relevance: 0.6
      },
      {
        topic: 'emergency_symptoms',
        content: 'Call 911 immediately for chest pain, difficulty breathing, severe headache, or loss of consciousness.',
        relevance: 0.9
      }
    ];

    // Simple keyword matching (replace with proper vector search)
    const queryLower = query.toLowerCase();
    return miniKB.filter(item => 
      queryLower.includes(item.topic.replace('_', ' ')) ||
      item.content.toLowerCase().includes(queryLower.split(' ')[0])
    ).slice(0, 3);
  }

  // Detect emergency intent
  detectEmergencyIntent(query) {
    const emergencyKeywords = [
      'emergency', 'urgent', 'help', 'pain', 'chest pain', 'can\'t breathe',
      'difficulty breathing', 'unconscious', 'bleeding', 'overdose',
      'suicide', 'heart attack', 'stroke', 'severe headache'
    ];

    const queryLower = query.toLowerCase();
    return emergencyKeywords.some(keyword => queryLower.includes(keyword));
  }

  // Generate card summary using gpt-4o-mini
  async generateCardSummary(cardContent, userProfile) {
    try {
      const prompt = `
Create a friendly, warm summary of this health card content for ${userProfile.full_name || 'the user'}.

Card Content: ${JSON.stringify(cardContent)}

User Context: ${userProfile.condition_selected || 'General health'}, Age: ${userProfile.age || 'Not specified'}

Guidelines:
- Use 6th-grade reading level
- Be warm and encouraging
- Keep to 60-120 seconds of speech (about 150-300 words)
- Include one specific actionable step
- Personalize based on user context
- No medical diagnosis or dosing advice
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful health coach creating card summaries for patients. Be warm, supportive, and educational.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating card summary:', error);
      throw new Error('Failed to generate card summary');
    }
  }

  // Generate TTS audio using gpt-4o-mini-tts
  async generateTTS(text, voiceId = null, speed = 1.0) {
    try {
      const selectedVoice = voiceId || process.env.VOICE_DEFAULT || 'alloy';
      const selectedSpeed = speed || parseFloat(process.env.VOICE_SPEED || '1.0');
      
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: selectedVoice,
        input: text,
        response_format: 'mp3',
        speed: selectedSpeed
      });

      return response;
    } catch (error) {
      console.error('Error generating TTS:', error);
      throw new Error('Failed to generate TTS audio');
    }
  }

  // Generate content hash for caching
  generateContentHash(userId, cardContent, voiceId = 'alloy') {
    const contentString = JSON.stringify({
      user_id: userId,
      content: cardContent,
      voice_id: voiceId,
      // Include a version identifier to invalidate cache when needed
      version: '1.0'
    });
    
    return crypto.createHash('md5').update(contentString).digest('hex');
  }
}

module.exports = OpenAIRealtimeService;