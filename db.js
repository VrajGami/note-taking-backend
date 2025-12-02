// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL from .env file
const connectionString = process.env.DATABASE_URL;

console.log('DATABASE_URL:', connectionString ? 'Loaded' : 'NOT FOUND');

// SSL configuration is MANDATORY for AWS RDS
const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // This fixes the "Self Signed Certificate" error on AWS
    }
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params) => {
        console.log('EXECUTING QUERY:', text);
        return pool.query(text, params);
    },
};