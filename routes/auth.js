// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const authMiddleware = require('../middleware/auth');
const { blacklistToken } = require('../utils/tokenStore');

// ----------------------
// 1. User Signup (Register)
// POST /api/signup
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body || {};

    // Basic input validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'username, email and password are required' });
    }

    try {
    // Hash the password before storing it
    const password_hash = await bcrypt.hash(password, config.SALT_ROUNDS);

        const sql = `
            INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, email;
        `;
        const result = await db.query(sql, [username, email, password_hash]);

        // Registration successful
        res.status(201).json({ 
            message: 'User registered successfully', 
            user: result.rows[0] 
        });
    } catch (err) {
        // Handle unique constraint errors (username or email already exists)
        if (err && (err.code === '23505' || err.constraint)) { 
            return res.status(400).json({ error: 'Username or email already exists.' });
        }
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

// ----------------------
// 2. User Login
// POST /api/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    try {
        // 1. Find user by email
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 2. Compare password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 3. Generate JWT token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        // Login successful
        res.json({ 
            message: 'Login successful', 
            token, // Send the token back to the client
            user_id: user.user_id 
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed.' });
    }
});


// ----------------------
// 3. Get current authenticated user
// GET /api/me
router.get('/me', authMiddleware, async (req, res) => {
    // req.user is populated by authMiddleware
    const { user_id, email } = req.user || {};
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ user_id, email });
});


// ----------------------
// 4. Logout (invalidate token)
// POST /api/logout
router.post('/logout', authMiddleware, async (req, res) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(400).json({ error: 'Token required to logout' });

    try {
        // Decode token to get expiry (do not verify again here as middleware already verified it)
        const decoded = jwt.decode(token, { complete: true }) || {};
        // `exp` is in seconds since epoch per JWT spec
        const exp = decoded.payload && decoded.payload.exp ? decoded.payload.exp * 1000 : null;
        if (exp) {
            blacklistToken(token, exp);
        }
        // Respond with no content or success
        return res.status(200).json({ message: 'Logged out' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;
