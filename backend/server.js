const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load environment variables
dotenv.config();

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
        console.log('Database initialization completed');
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

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/conditions', conditionsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/ai', aiRoutes);

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
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Database initialized at: ${dbPath}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, db };