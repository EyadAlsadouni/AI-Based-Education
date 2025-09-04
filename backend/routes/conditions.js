const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', process.env.DATABASE_PATH || 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// GET /api/conditions - Get all conditions
router.get('/', (req, res) => {
  const query = 'SELECT * FROM conditions ORDER BY name';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching conditions:', err);
      return res.status(500).json({ error: 'Failed to fetch conditions' });
    }

    res.json(rows);
  });
});

// GET /api/conditions/:name - Get specific condition by name
router.get('/:name', (req, res) => {
  const conditionName = req.params.name;
  
  const query = 'SELECT * FROM conditions WHERE name = ?';
  
  db.get(query, [conditionName], (err, row) => {
    if (err) {
      console.error('Error fetching condition:', err);
      return res.status(500).json({ error: 'Failed to fetch condition' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    res.json(row);
  });
});

// GET /api/conditions/:name/goals - Get goals specific to a condition
router.get('/:name/goals', (req, res) => {
  const conditionName = req.params.name.toLowerCase();
  
  // Define condition-specific goals
  const conditionGoals = {
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

  const goals = conditionGoals[conditionName] || [
    'Understand my condition better',
    'Learn management strategies',
    'Improve my quality of life',
    'Other...'
  ];

  res.json({ condition: conditionName, goals });
});

module.exports = router;