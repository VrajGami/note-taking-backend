// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL from .env file
// Format: postgres://username:password@host:port/database
const connectionString = process.env.DATABASE_URL;

console.log('DATABASE_URL:', connectionString ? 'Loaded' : 'NOT FOUND');

// Parse the connection string manually
const url = new URL(connectionString);
const config = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.slice(1), // Remove leading slash
};

console.log('Database config:', {
    user: config.user,
    host: config.host,
    port: config.port,
    database: config.database
});

const pool = new Pool(config);

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