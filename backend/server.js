const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not provided - Voice Coach features will not work!');
  console.error('Please add your OpenAI API key to the .env file');
} else {
  console.log('✅ OpenAI API key detected and configured');
}

const app = express();
const PORT = process.env.PORT || 6001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, process.env.DATABASE_PATH || 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create tables in sequence
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          gender TEXT NOT NULL,
          age INTEGER NOT NULL,
          health_goals TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          condition_selected TEXT NOT NULL,
          diagnosis_year INTEGER,
          takes_medication BOOLEAN DEFAULT FALSE,
          medications TEXT,
          checks_vitals TEXT,
          main_goal TEXT,
          main_question TEXT,
          ai_response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Conditions table
      db.run(`
        CREATE TABLE IF NOT EXISTS conditions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          icon TEXT NOT NULL,
          description TEXT
        )
      `);

      // Medications table
      db.run(`
        CREATE TABLE IF NOT EXISTS medications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT NOT NULL,
          condition_category TEXT
        )
      `);

      // Voice Coach Sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS voice_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          session_id TEXT UNIQUE NOT NULL,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ended_at DATETIME,
          lang TEXT DEFAULT 'en',
          total_turns INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Voice Coach Conversation Turns table
      db.run(`
        CREATE TABLE IF NOT EXISTS voice_turns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          turn_number INTEGER NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          input_type TEXT CHECK (input_type IN ('text', 'audio')),
          text_content TEXT,
          audio_duration_ms INTEGER,
          grounded_from TEXT,
          sources TEXT, -- JSON array of sources
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES voice_sessions (session_id)
        )
      `);

      // TTS Audio Cache table
      db.run(`
        CREATE TABLE IF NOT EXISTS tts_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          card_id TEXT,
          content_hash TEXT NOT NULL,
          voice_id TEXT NOT NULL,
          audio_url TEXT,
          audio_duration_ms INTEGER,
          script_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Mini Knowledge Base table for FAQ/vetted content
      db.run(`
        CREATE TABLE IF NOT EXISTS mini_kb (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          condition_category TEXT,
          tags TEXT, -- JSON array of tags
          priority INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Dashboard Content table for storing AI-generated content
      db.run(`
        CREATE TABLE IF NOT EXISTS dashboard_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          cards_data TEXT, -- JSON data for dashboard cards
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
          return;
        }

        // Insert default data
        insertDefaultData(resolve, reject);
      });
    });
  });
};

const insertDefaultData = (resolve, reject) => {
  // Insert default conditions
  const conditions = [
    { name: 'Diabetes', icon: '💉', description: 'Blood sugar management and diabetes care' },
    { name: 'Heart Health', icon: '❤️', description: 'Cardiovascular health and heart disease prevention' },
    { name: 'Pre-Procedure Prep', icon: '🏥', description: 'Preparation for medical procedures and surgeries' },
    { name: 'Mental Wellness', icon: '😌', description: 'Mental health support and wellness strategies' }
  ];

  let conditionsInserted = 0;
  conditions.forEach(condition => {
    db.run(`
      INSERT OR IGNORE INTO conditions (name, icon, description) 
      VALUES (?, ?, ?)
    `, [condition.name, condition.icon, condition.description], (err) => {
      if (err) {
        console.error('Error inserting condition:', err);
      }
      conditionsInserted++;
      if (conditionsInserted === conditions.length) {
        insertMedications(resolve, reject);
      }
    });
  });
};

const insertMedications = (resolve, reject) => {
  // Insert default medications
  const medications = [
    { name: 'Metformin', description: 'First-line oral therapy for type 2 diabetes', category: 'diabetes' },
    { name: 'Insulin Glargine (Lantus/Basaglar)', description: 'Long-acting insulin for diabetes', category: 'diabetes' },
    { name: 'Empagliflozin (Jardiance)', description: 'SGLT2 inhibitor, diabetes + heart protection', category: 'diabetes' },
    { name: 'Semaglutide (Ozempic/Rybelsus)', description: 'GLP-1 receptor agonist, diabetes + weight management', category: 'diabetes' },
    { name: 'Atorvastatin (Lipitor)', description: 'Cholesterol lowering, key in heart health', category: 'heart' },
    { name: 'Amlodipine', description: 'Calcium channel blocker, used for high blood pressure', category: 'heart' },
    { name: 'Losartan', description: 'Angiotensin receptor blocker (ARB), hypertension + kidney protection', category: 'heart' },
    { name: 'Aspirin (low-dose, 81mg)', description: 'Antiplatelet for heart protection', category: 'heart' },
    { name: 'Sertraline (Zoloft)', description: 'SSRI antidepressant, relevant to mental wellness', category: 'mental' },
    { name: 'Lorazepam (Ativan)', description: 'Benzodiazepine, sometimes prescribed short-term for anxiety or pre-procedure sedation', category: 'mental' }
  ];

  let medicationsInserted = 0;
  medications.forEach(med => {
    db.run(`
      INSERT OR IGNORE INTO medications (name, description, condition_category) 
      VALUES (?, ?, ?)
    `, [med.name, med.description, med.category], (err) => {
      if (err) {
        console.error('Error inserting medication:', err);
      }
      medicationsInserted++;
      if (medicationsInserted === medications.length) {
        insertMiniKB(resolve, reject);
      }
    });
  });
};

// Insert default mini knowledge base content
const insertMiniKB = (resolve, reject) => {
  const kbEntries = [
    {
      title: 'Emergency Signs - When to Seek Immediate Help',
      content: 'Seek immediate medical attention if you experience: chest pain, difficulty breathing, severe dizziness, loss of consciousness, severe allergic reactions, or any symptoms that feel life-threatening. Call emergency services (911) immediately.',
      condition_category: 'general',
      tags: JSON.stringify(['emergency', 'safety', 'urgent']),
      priority: 10
    },
    {
      title: 'General Medication Safety',
      content: 'Always take medications as prescribed by your healthcare provider. Never stop or change medications without consulting your doctor first. Keep a current list of all medications and share it with all healthcare providers.',
      condition_category: 'general',
      tags: JSON.stringify(['medication', 'safety', 'general']),
      priority: 5
    },
    {
      title: 'Blood Sugar Monitoring - Diabetes',
      content: 'Regular blood sugar monitoring helps track how food, activity, and medications affect your glucose levels. Your target ranges should be discussed with your healthcare team. Keep a log of readings to share with your doctor.',
      condition_category: 'diabetes',
      tags: JSON.stringify(['diabetes', 'monitoring', 'blood-sugar']),
      priority: 8
    },
    {
      title: 'Heart-Healthy Diet Basics',
      content: 'Focus on fruits, vegetables, whole grains, lean proteins, and healthy fats. Limit sodium, saturated fats, and added sugars. The DASH diet and Mediterranean diet are proven heart-healthy eating patterns.',
      condition_category: 'heart',
      tags: JSON.stringify(['heart-health', 'diet', 'nutrition']),
      priority: 7
    }
  ];

  let kbInserted = 0;
  kbEntries.forEach(entry => {
    db.run(`
      INSERT OR IGNORE INTO mini_kb (title, content, condition_category, tags, priority) 
      VALUES (?, ?, ?, ?, ?)
    `, [entry.title, entry.content, entry.condition_category, entry.tags, entry.priority], (err) => {
      if (err) {
        console.error('Error inserting KB entry:', err);
      }
      kbInserted++;
      if (kbInserted === kbEntries.length) {
        console.log('Database initialization completed with Voice Coach schema');
        resolve();
      }
    });
  });
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'AI-Based Patient Education API is running!' });
});

// Import route modules
const userRoutes = require('./routes/users');
const conditionsRoutes = require('./routes/conditions');
const medicationsRoutes = require('./routes/medications');
const aiRoutes = require('./routes/ai');
const voiceRoutes = require('./routes/voice');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/conditions', conditionsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/voice', voiceRoutes);

// Initialize WebSocket proxy for realtime
if (voiceRoutes.ws) {
  voiceRoutes.ws(app);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Create WebSocket server
    const wss = new WebSocket.Server({ 
      server,
      path: '/api/voice/chat'
    });
    
    // Handle WebSocket connections
    wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');
      
      let voiceChatService = null;
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'init_session') {
            const { user_id, session_id } = data;
            
            if (!user_id || !session_id) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'User ID and session ID are required'
              }));
              return;
            }
            
            // Initialize voice chat service
            voiceChatService = new VoiceChatService(ws, user_id, session_id);
            
          } else if (voiceChatService) {
            // Forward message to voice chat service
            await voiceChatService.handleMessage(message);
          } else {
            ws.send(JSON.stringify({
              type: 'error', 
              message: 'Session not initialized'
            }));
          }
          
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        if (voiceChatService) {
          voiceChatService.cleanup();
        }
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (voiceChatService) {
          voiceChatService.cleanup();
        }
      });
    });
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Database initialized at: ${dbPath}`);
      console.log(`WebSocket endpoint: ws://localhost:${PORT}/api/voice/chat`);
    });
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, db };