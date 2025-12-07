// db.js
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// 1. Log to prove this file is loaded
console.log('--- DB.JS LOADED: SSL FIX ACTIVE ---'); 

const pool = new Pool({
    connectionString: connectionString,
    // 2. The Critical Fix
    ssl: {
        rejectUnauthorized: false
    }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Database connected successfully');
    }
});

module.exports = {
    query: (text, params) => {
        return pool.query(text, params);
    },
};