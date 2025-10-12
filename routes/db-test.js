// routes/db-test.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection utility

// GET /api/db-check
router.get('/db-check', async (req, res) => {
    try {
        // Execute a very simple, safe PostgreSQL query
        // This query just returns the current date/time, proving the connection works
        const result = await db.query('SELECT NOW() AS current_time');
        
        // If the query succeeds, send a successful response
        res.json({
            status: 'Database Connection OK',
            timestamp: result.rows[0].current_time
        });
    } catch (err) {
        // If the query fails, send an error response with details
        console.error('Database Connection Error:', err.message);
        res.status(500).json({
            status: 'Database Connection FAILED',
            error: 'Could not connect to PostgreSQL. Check credentials and server status.',
            details: err.message
        });
    }
});

module.exports = router;