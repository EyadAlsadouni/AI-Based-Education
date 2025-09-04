const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', process.env.DATABASE_PATH || 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// GET /api/medications - Get all medications
router.get('/', (req, res) => {
  const { condition } = req.query;
  
  let query = 'SELECT * FROM medications';
  let params = [];
  
  if (condition) {
    query += ' WHERE condition_category = ?';
    params.push(condition.toLowerCase());
  }
  
  query += ' ORDER BY name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching medications:', err);
      return res.status(500).json({ error: 'Failed to fetch medications' });
    }

    res.json(rows);
  });
});

// GET /api/medications/search - Search medications by name
router.get('/search', (req, res) => {
  const { q, condition } = req.query;
  
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }
  
  let query = 'SELECT * FROM medications WHERE name LIKE ?';
  let params = [`%${q}%`];
  
  if (condition) {
    query += ' AND condition_category = ?';
    params.push(condition.toLowerCase());
  }
  
  query += ' ORDER BY name LIMIT 10';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error searching medications:', err);
      return res.status(500).json({ error: 'Failed to search medications' });
    }

    res.json(rows);
  });
});

// GET /api/medications/:id - Get specific medication by ID
router.get('/:id', (req, res) => {
  const medicationId = req.params.id;
  
  const query = 'SELECT * FROM medications WHERE id = ?';
  
  db.get(query, [medicationId], (err, row) => {
    if (err) {
      console.error('Error fetching medication:', err);
      return res.status(500).json({ error: 'Failed to fetch medication' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json(row);
  });
});

module.exports = router;