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

// POST /api/voice/dashboard-card-audio - Generate card audio for dashboard (direct content reading)
router.post('/dashboard-card-audio', async (req, res) => {
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
        let cardContent = '';
        
        // Get card content based on card_id - now supports dynamic card IDs
        // First try to get content using the card_id as a direct key
        if (dashboard[card_id]) {
          cardContent = dashboard[card_id];
        } else {
          // Fallback to legacy static card IDs for backward compatibility
          switch (card_id) {
            case 'diagnosis':
              cardContent = dashboard.diagnosis_basics || '';
              break;
            case 'nutrition':
              cardContent = dashboard.nutrition_carbs || '';
              break;
            case 'workout':
              cardContent = dashboard.workout || '';
              break;
            case 'daily_plan':
              cardContent = dashboard.daily_plan || '';
              break;
            default:
              return res.status(400).json({ error: `Card content not found for ID: ${card_id}` });
          }
        }

        if (!cardContent) {
          return res.status(404).json({ error: 'Card content not found' });
        }

        // Clean content for audio reading (remove references, video links, etc.)
        const cleanedContent = cleanContentForAudio(cardContent);

        // Create cache key for this content
        const contentHash = require('crypto').createHash('md5').update(cleanedContent).digest('hex');
        const cacheKey = `dashboard_${user_id}_${card_id}_${contentHash}`;

        // Check cache first
        db.get(`
          SELECT audio_url, audio_duration_ms, script_text 
          FROM tts_cache 
          WHERE cache_key = ? AND expires_at > datetime('now')
        `, [cacheKey], async (err, cached) => {
          if (err) {
            console.error('Cache lookup error:', err);
            return res.status(500).json({ error: 'Cache lookup failed' });
          }

          if (cached) {
            // Return cached result immediately
            console.log('Returning cached audio for dashboard card');
            return res.json({
              success: true,
              script_text: cached.script_text,
              audio_url: cached.audio_url,
              duration_ms: cached.audio_duration_ms,
              cached: true
            });
          }

          try {
            // Generate TTS using gpt-4o-mini-tts with consistent voice
            console.log('Generating new TTS for dashboard card...');
            const ttsResponse = await realtimeService.generateTTS(cleanedContent, 'alloy', 1.0);
            const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
            const audioBase64 = audioBuffer.toString('base64');
            const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

            // Estimate duration
            const wordCount = cleanedContent.split(' ').length;
            const estimatedDuration = Math.round((wordCount / 150) * 60 * 1000);

            // Cache the result for 24 hours
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            db.run(`
              INSERT OR REPLACE INTO tts_cache 
              (cache_key, user_id, card_id, content_hash, voice_id, audio_url, audio_duration_ms, script_text, expires_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [cacheKey, user_id, card_id, contentHash, 'alloy', audioUrl, estimatedDuration, cleanedContent, expiresAt.toISOString()]);

            res.json({
              success: true,
              script_text: cleanedContent,
              audio_url: audioUrl,
              duration_ms: estimatedDuration,
              cached: false
            });

          } catch (ttsError) {
            console.error('TTS generation error:', ttsError);
            res.status(500).json({ error: 'Failed to generate audio' });
          }
        });

      } catch (parseError) {
        console.error('Error parsing dashboard content:', parseError);
        res.status(500).json({ error: 'Invalid dashboard content' });
      }
    });

  } catch (error) {
    console.error('Error in dashboard-card-audio:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Helper function to clean content for audio reading
function cleanContentForAudio(content) {
  if (!content) return '';
  
  let cleaned = content;
  
  // Remove references section and everything after it
  const referencesIndex = cleaned.toLowerCase().indexOf('references:');
  if (referencesIndex !== -1) {
    cleaned = cleaned.substring(0, referencesIndex).trim();
  }
  
  // Remove video links and references
  cleaned = cleaned.replace(/\[(\d+)\]\s*[^\n]*/g, ''); // Remove [1], [2], etc.
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, ''); // Remove URLs
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Convert [text](url) to just text
  
  // Remove extra whitespace and clean up formatting
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold formatting
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1'); // Remove italic formatting
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove excessive line breaks
  cleaned = cleaned.replace(/^\s+|\s+$/g, ''); // Trim start and end
  
  // Clean up any remaining artifacts
  cleaned = cleaned.replace(/\s+/g, ' '); // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\n\s+/g, '\n'); // Remove leading spaces from lines
  
  return cleaned.trim();
}

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
    
    // Pipe client -> upstream with CONTEXT INJECTION
    client.on('message', async (data, isBinary) => {
      if (upstream.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.parse(data.toString());
          console.log('[WebSocket Proxy] Client -> OpenAI:', message.type);
          
          // Log function definitions being sent
          if (message.type === 'session.update' && message.session?.tools) {
            console.log('[WebSocket Proxy] Tools sent to OpenAI:', message.session.tools.map(t => t.name));
          }
          
          // 🎯 CONTEXT INJECTION: Automatically inject dashboard data before user messages
          if (message.type === 'conversation.item.create' && 
              message.item?.type === 'message' && 
              message.item?.role === 'user') {
            
            console.log('[Context Injection] User message detected, injecting dashboard context...');
            
            try {
              // Fetch complete dashboard context from database
              const context = await realtimeService.getUserContext(userId, 'dashboard context');
              
              // Build a clear, explicit context message with all dashboard data
              const cardsText = context.dashboard_cards.length > 0 
                ? context.dashboard_cards.map((card, i) => {
                    // Include first 300 chars of content as preview
                    const contentPreview = card.content && card.content !== '(Content not yet generated)' 
                      ? card.content.substring(0, 300).replace(/\n/g, ' ') + '...'
                      : 'Content available on request';
                    return `   ${i + 1}. **${card.title}** - ${card.description}\n      Preview: ${contentPreview}`;
                  }).join('\n\n')
                : '   (No cards found)';
              
              const contextText = `[SYSTEM CONTEXT - This is the user's dashboard data. Use it to answer their question.]

USER PROFILE:
- Name: ${context.user_profile.full_name || 'Patient'}
- Health Condition: ${context.user_profile.condition_selected || 'Not specified'}
- Primary Health Goal: ${context.user_profile.main_goal || 'Not specified'}
- Current Medications: ${context.user_profile.medications?.join(', ') || 'None listed'}

DASHBOARD CARDS (Total: ${context.dashboard_cards.length}):
${cardsText}

PAGE FEATURES & ACTIONS AVAILABLE:
- ${context.page_features.features.join('\n- ')}

IMPORTANT INSTRUCTIONS:
1. You HAVE ACCESS to the user's health profile and card information above
2. When asked about their health goal, use the "Primary Health Goal" from USER PROFILE
3. When asked about card content, use the Preview information provided
4. For detailed content, tell them to click the card or use the play button
5. Always use **bold** formatting for card titles and section headers
6. Be conversational and answer follow-up questions naturally
7. FORMATTING: When user requests specific format (bullet points, numbered list, etc.), use that format:
   - For bullet points: Start lines with "- " (dash + space)
   - For numbered lists: Use "1. ", "2. ", "3. " format
   - For line breaks: Use actual line breaks between items
   - Example bullet format:
     - First point here
     - Second point here
     - Third point here

Now answer the user's question using this data.`;
              
              // Create a system-level context message
              const contextMessage = {
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'system',
                  content: [{
                    type: 'input_text',
                    text: contextText
                  }]
                }
              };
              
              // Send context BEFORE user message
              upstream.send(JSON.stringify(contextMessage));
              console.log('[Context Injection] ✅ Dashboard context injected successfully');
              console.log(`[Context Injection] Sent ${context.dashboard_cards.length} cards:`, 
                context.dashboard_cards.map(c => c.title).join(', ') || 'None');
              
            } catch (error) {
              console.error('[Context Injection] ❌ Error injecting context:', error);
            }
          }
          
        } catch (e) {
          // Binary data, forward as-is
        }
        upstream.send(data, { binary: isBinary });
      }
    });
    
    // Pipe upstream -> client (simple forwarding, no function interception needed with context injection)
    upstream.on('message', async (data, isBinary) => {
      if (client.readyState === WebSocket.OPEN) {
        // Forward all messages from OpenAI to client
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

// POST /api/voice/webrtc/sdp - WebRTC SDP exchange
router.post('/webrtc/sdp', async (req, res) => {
  try {
    const { sdp, config } = req.body;

    if (!sdp) {
      return res.status(400).json({ error: 'SDP offer is required' });
    }

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not initialized' });
    }

    console.log('WebRTC SDP exchange request received');

    // Create a new Realtime session
    const session = await openai.beta.realtime.connect('gpt-4o-realtime-preview-2024-10-01', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    // Send session configuration
    await session.send({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: config?.instructions || `You are a helpful health coach for a patient education platform.
          Provide warm, supportive responses in a 6th-grade reading level.
          Keep responses brief (30-60 seconds of speech).
          Always ground your responses in the user's dashboard and profile data when available.
          Never provide medical diagnosis or dosing advice.
          If asked about emergencies, immediately recommend contacting emergency services.
          CRITICAL: Always respond in English only. Never use any other language.
          If the user speaks in another language, acknowledge it but respond in English.`,
        voice: 'alloy',
        tools: config?.tools || []
      }
    });

    // For now, return a simple answer SDP (in a real implementation, you'd handle the actual SDP negotiation)
    // This is a placeholder - the actual WebRTC implementation would need proper SDP handling
    const answerSdp = `v=0
o=- ${Date.now()} ${Date.now()} IN IP4 127.0.0.1
s=-
t=0 0
m=audio 9 RTP/SAVPF 111
c=IN IP4 127.0.0.1
a=rtpmap:111 opus/48000/2
a=sendrecv
a=ice-ufrag:${Math.random().toString(36).substring(7)}
a=ice-pwd:${Math.random().toString(36).substring(7)}
a=fingerprint:sha-256 ${crypto.randomBytes(32).toString('hex')}
a=setup:active
a=mid:0
a=rtcp-mux`;

    res.json({ sdp: answerSdp });

    // Handle the session messages (this would need to be properly integrated with WebRTC)
    session.on('message', (message) => {
      console.log('WebRTC session message:', message.type);
      // Here you would handle the message and send it back to the client via WebRTC data channel
    });

    session.on('error', (error) => {
      console.error('WebRTC session error:', error);
    });

    session.on('close', () => {
      console.log('WebRTC session closed');
    });

  } catch (error) {
    console.error('WebRTC SDP exchange error:', error);
    res.status(500).json({ error: 'Failed to handle WebRTC SDP exchange' });
  }
});

module.exports = router;