const express = require('express');
const WebSocket = require('ws');
const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const OpenAIRealtimeService = require('../services/OpenAIRealtimeService');

const router = express.Router();

// Initialize OpenAI Realtime Service
const realtimeService = new OpenAIRealtimeService();

// Database connection
const dbPath = path.join(__dirname, '..', process.env.DATABASE_PATH || 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize OpenAI with error handling
let openai = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✓ OpenAI API initialized successfully');
  } else {
    console.error('❌ OPENAI_API_KEY not provided - Voice Coach features will not work!');
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI:', error.message);
}

// Helper function to generate content hash
const generateContentHash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};

// Helper function to generate cache key
const generateCacheKey = (userId, cardId, contentHash, voiceId) => {
  return `tts:${userId}:${cardId}:${contentHash}:${voiceId}`;
};

// POST /api/voice/realtime-token - Get OpenAI Realtime session token
router.post('/realtime-token', async (req, res) => {
  try {
    const { user_id, session_id } = req.body;

    if (!user_id || !session_id) {
      return res.status(400).json({ error: 'User ID and session ID are required' });
    }

    // Create realtime session token
    const tokenData = await realtimeService.createRealtimeToken(user_id, session_id);

    res.json({
      success: true,
      token: tokenData.token,
      ws_url: tokenData.ws_url,
      expires_at: tokenData.expires_at
    });

  } catch (error) {
    console.error('Error creating realtime token:', error);
    res.status(500).json({ error: 'Failed to create realtime session' });
  }
});

// POST /api/voice/context - Get user context for RAG grounding
router.post('/context', async (req, res) => {
  try {
    const { query, user_id } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get user context for grounding
    const context = await realtimeService.getUserContext(user_id || 1, query);

    res.json(context);

  } catch (error) {
    console.error('Error getting user context:', error);
    res.status(500).json({ error: 'Failed to get user context' });
  }
});

// POST /api/voice/summarize-card-v2 - Generate card summary with gpt-4o-mini-tts
router.post('/summarize-card-v2', async (req, res) => {
  try {
    const { user_id, card_id } = req.body;

    if (!user_id || !card_id) {
      return res.status(400).json({ error: 'User ID and card ID are required' });
    }

    // Get user profile and card content
    const dashboardQuery = `
      SELECT us.ai_response, us.condition_selected, u.full_name, u.age 
      FROM user_sessions us 
      JOIN users u ON us.user_id = u.id 
      WHERE us.user_id = ?
    `;

    db.get(dashboardQuery, [user_id], async (err, row) => {
      if (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ error: 'Failed to fetch user data' });
      }

      if (!row || !row.ai_response) {
        return res.status(404).json({ error: 'User data not found' });
      }

      try {
        const dashboard = JSON.parse(row.ai_response);
        const cardContent = dashboard[card_id];

        if (!cardContent) {
          return res.status(404).json({ error: 'Card content not found' });
        }

        const userProfile = {
          full_name: row.full_name,
          age: row.age,
          condition_selected: row.condition_selected
        };

        // Generate content hash for caching
        const contentHash = realtimeService.generateContentHash(user_id, cardContent);
        const cacheKey = `tts_v2:${user_id}:${card_id}:${contentHash}`;

        // Check cache first
        db.get('SELECT * FROM tts_cache WHERE cache_key = ? AND expires_at > datetime("now")', 
          [cacheKey], async (err, cached) => {
          if (cached && cached.audio_url) {
            return res.json({
              success: true,
              script_text: cached.script_text,
              audio_url: cached.audio_url,
              duration_ms: cached.audio_duration_ms,
              cached: true
            });
          }

          try {
            // Generate summary using gpt-4o-mini
            const scriptText = await realtimeService.generateCardSummary(cardContent, userProfile);

            // Generate TTS using gpt-4o-mini-tts
            const ttsResponse = await realtimeService.generateTTS(scriptText);
            const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
            const audioBase64 = audioBuffer.toString('base64');
            const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

            // Estimate duration
            const wordCount = scriptText.split(' ').length;
            const estimatedDuration = Math.round((wordCount / 150) * 60 * 1000);

            // Cache the result
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            db.run(`
              INSERT OR REPLACE INTO tts_cache 
              (cache_key, user_id, card_id, content_hash, voice_id, audio_url, audio_duration_ms, script_text, expires_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [cacheKey, user_id, card_id, contentHash, 'alloy', audioUrl, estimatedDuration, scriptText, expiresAt.toISOString()]);

            res.json({
              success: true,
              script_text: scriptText,
              audio_url: audioUrl,
              duration_ms: estimatedDuration,
              cached: false
            });

          } catch (error) {
            console.error('Error generating TTS:', error);
            res.status(500).json({ error: 'Failed to generate audio' });
          }
        });

      } catch (parseError) {
        console.error('Error parsing dashboard content:', parseError);
        res.status(500).json({ error: 'Invalid dashboard content' });
      }
    });

  } catch (error) {
    console.error('Error in summarize-card-v2:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/voice/preview - Generate voice preview for selection
router.post('/preview', async (req, res) => {
  try {
    const { voice = 'alloy', text, speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for preview' });
    }

    // Generate TTS preview
    const ttsResponse = await realtimeService.generateTTS(text, voice, speed);
    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());

    // Return audio as blob
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);

  } catch (error) {
    console.error('Error generating voice preview:', error);
    res.status(500).json({ error: 'Failed to generate voice preview' });
  }
});

// Legacy endpoints for backward compatibility
// GET /api/voice/cards/:user_id - Get user's voice cards
router.get('/cards/:user_id', (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get user's dashboard content to generate cards
  const query = `
    SELECT us.ai_response, us.condition_selected 
    FROM user_sessions us 
    WHERE us.user_id = ?
  `;

  db.get(query, [user_id], (err, row) => {
    if (err) {
      console.error('Error fetching cards:', err);
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }

    if (!row || !row.ai_response) {
      return res.json({
        success: true,
        cards: []
      });
    }

    try {
      const dashboard = JSON.parse(row.ai_response);
      
      // Convert dashboard content to card format
      const cards = Object.keys(dashboard).map(cardId => ({
        id: cardId,
        title: cardId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        duration_estimate: 90000 // 90 seconds default
      }));

      res.json({
        success: true,
        cards
      });

    } catch (parseError) {
      console.error('Error parsing dashboard content:', parseError);
      res.status(500).json({ error: 'Invalid dashboard content' });
    }
  });
});

// GET /api/voice/profile/:user_id - Get user profile for voice coach
router.get('/profile/:user_id', (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = `
    SELECT 
      u.full_name, u.gender, u.age, u.health_goals,
      us.condition_selected, us.diagnosis_year, us.takes_medication, 
      us.medications, us.checks_vitals, us.main_goal, us.main_question
    FROM users u
    LEFT JOIN user_sessions us ON u.id = us.user_id
    WHERE u.id = ?
  `;

  db.get(query, [user_id], (err, row) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
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
    };

    res.json({
      success: true,
      profile
    });
  });
});

// POST /api/voice/session - Create new voice session
router.post('/session', (req, res) => {
  const { user_id, lang = 'en' } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const sessionId = uuidv4();

  db.run(`
    INSERT INTO voice_sessions (user_id, session_id, lang)
    VALUES (?, ?, ?)
  `, [user_id, sessionId, lang], function(err) {
    if (err) {
      console.error('Error creating voice session:', err);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    res.json({
      success: true,
      session_id: sessionId,
      message: 'Voice session created'
    });
  });
});

// WebSocket proxy for OpenAI Realtime API (following ChatGPT's recommended pattern)
router.ws = function(app) {
  const WebSocket = require('ws');
  const { WebSocketServer } = WebSocket;
  
  // Create WebSocket server for realtime proxy
  const wss = new WebSocketServer({ 
    port: 6002,
    path: '/api/realtime/ws'
  });
  
  wss.on('connection', (client, req) => {
    console.log('Client connected to realtime proxy');
    
    // Extract user info from connection
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('user_id');
    const sessionId = url.searchParams.get('session_id');
    
    if (!userId || !sessionId) {
      client.close(1008, 'Missing user_id or session_id');
      return;
    }
    
    // Create connection to OpenAI Realtime API with proper headers (ChatGPT pattern)
    const upstream = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });
    
    // Pipe client -> upstream (ChatGPT's exact pattern)
    client.on('message', (data, isBinary) => {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(data, { binary: isBinary });
      }
    });
    
    // Pipe upstream -> client (ChatGPT's exact pattern)
    upstream.on('message', (data, isBinary) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
    
    // Close both connections helper (ChatGPT pattern)
    const closeBoth = () => {
      try { upstream.close(); } catch {}
      try { client.close(); } catch {}
    };
    
    // Handle connection events
    client.on('close', closeBoth);
    upstream.on('close', closeBoth);
    upstream.on('error', (error) => {
      console.error('OpenAI upstream error:', error);
      closeBoth();
    });
    client.on('error', (error) => {
      console.error('Client error:', error);
      closeBoth();
    });
    
    upstream.on('open', () => {
      console.log('Connected to OpenAI Realtime API via proxy');
    });
  });
  
  console.log('Realtime WebSocket proxy server started on ws://localhost:6002/api/realtime/ws');
};

module.exports = router;