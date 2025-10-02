const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', process.env.DATABASE_PATH || 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// POST /api/users - Create a new user
router.post('/', (req, res) => {
  const { full_name, gender, age, health_goals } = req.body;

  // Validation
  if (!full_name || !gender || !age || !health_goals) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (age < 1 || age > 120) {
    return res.status(400).json({ error: 'Age must be between 1 and 120' });
  }

  const healthGoalsString = Array.isArray(health_goals) ? health_goals.join(',') : health_goals;

  const query = `
    INSERT INTO users (full_name, gender, age, health_goals) 
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [full_name, gender, age, healthGoalsString], function(err) {
    if (err) {
      console.error('Error creating user:', err);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.status(201).json({
      success: true,
      user_id: this.lastID,
      message: 'User created successfully'
    });
  });
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  const query = 'SELECT * FROM users WHERE id = ?';
  
  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }

    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse health_goals back to array
    const user = {
      ...row,
      health_goals: row.health_goals.split(',')
    };

    res.json(user);
  });
});

// POST /api/users/:id/session - Create or update user session data
router.post('/:id/session', (req, res) => {
  const userId = req.params.id;
  const {
    condition_selected,
    diagnosis_year,
    takes_medication,
    medications,
    checks_vitals,
    main_goal,
    main_question,
    knowledge_level,
    main_interests,
    learning_style,
    other_knowledge
  } = req.body;

  console.log('Session update request for user:', userId);
  console.log('Request body:', req.body);

  // Validation
  if (!condition_selected) {
    console.log('Missing condition_selected');
    return res.status(400).json({ error: 'Condition selection is required' });
  }

  // Check if user exists
  db.get('SELECT id FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if session already exists
    db.get('SELECT id FROM user_sessions WHERE user_id = ?', [userId], (err, existingSession) => {
      if (err) {
        console.error('Error checking session:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const medicationsString = Array.isArray(medications) ? medications.join(',') : medications || '';

      if (existingSession) {
        // Update existing session
        const updateQuery = `
          UPDATE user_sessions 
          SET condition_selected = ?, diagnosis_year = ?, takes_medication = ?, 
              medications = ?, checks_vitals = ?, main_goal = ?, main_question = ?,
              knowledge_level = ?, main_interests = ?, learning_style = ?, other_knowledge = ?
          WHERE user_id = ?
        `;

        const mainInterestsString = Array.isArray(main_interests) ? main_interests.join(',') : main_interests || '';
        const mainGoalString = Array.isArray(main_goal) ? main_goal.join(',') : main_goal || '';

        db.run(updateQuery, [
          condition_selected, diagnosis_year, takes_medication,
          medicationsString, checks_vitals, mainGoalString, main_question,
          knowledge_level, mainInterestsString, learning_style, other_knowledge, userId
        ], function(err) {
          if (err) {
            console.error('Error updating session:', err);
            console.error('SQL Query:', updateQuery);
            console.error('Query params:', [condition_selected, diagnosis_year, takes_medication, medicationsString, checks_vitals, mainGoalString, main_question, knowledge_level, mainInterestsString, learning_style, other_knowledge, userId]);
            return res.status(500).json({ error: 'Failed to update session' });
          }

          console.log('Session updated successfully for user:', userId);
          res.json({
            success: true,
            session_id: existingSession.id,
            message: 'Session updated successfully'
          });
        });
      } else {
        // Create new session
        const insertQuery = `
          INSERT INTO user_sessions 
          (user_id, condition_selected, diagnosis_year, takes_medication, medications, 
           checks_vitals, main_goal, main_question, knowledge_level, main_interests, 
           learning_style, other_knowledge) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const mainInterestsString = Array.isArray(main_interests) ? main_interests.join(',') : main_interests || '';
        const mainGoalString = Array.isArray(main_goal) ? main_goal.join(',') : main_goal || '';

        db.run(insertQuery, [
          userId, condition_selected, diagnosis_year, takes_medication,
          medicationsString, checks_vitals, mainGoalString, main_question,
          knowledge_level, mainInterestsString, learning_style, other_knowledge
        ], function(err) {
          if (err) {
            console.error('Error creating session:', err);
            console.error('SQL Query:', insertQuery);
            console.error('Query params:', [userId, condition_selected, diagnosis_year, takes_medication, medicationsString, checks_vitals, mainGoalString, main_question, knowledge_level, mainInterestsString, learning_style, other_knowledge]);
            return res.status(500).json({ error: 'Failed to create session' });
          }

          console.log('Session created successfully for user:', userId);
          res.status(201).json({
            success: true,
            session_id: this.lastID,
            message: 'Session created successfully'
          });
        });
      }
    });
  });
});

// GET /api/users/:id/session - Get user session data
router.get('/:id/session', (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT us.*, u.full_name, u.gender, u.age, u.health_goals 
    FROM user_sessions us 
    JOIN users u ON us.user_id = u.id 
    WHERE us.user_id = ?
  `;

  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching session:', err);
      return res.status(500).json({ error: 'Failed to fetch session' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Parse arrays
    const session = {
      ...row,
      health_goals: row.health_goals.split(','),
      medications: row.medications ? row.medications.split(',') : []
    };

    res.json(session);
  });
});

module.exports = router;