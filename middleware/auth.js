// middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const { isTokenBlacklisted } = require('../utils/tokenStore');

// Authentication middleware - validates JWT in Authorization header and
// attaches decoded user payload to req.user.
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: token required' });
    }

    const token = authHeader.split(' ')[1];

    // Reject blacklisted tokens immediately
    if (isTokenBlacklisted(token)) {
        return res.status(401).json({ error: 'Unauthorized: token revoked' });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Attach a minimal user object to the request for downstream handlers.
        req.user = {
            user_id: decoded.user_id,
            email: decoded.email,
        };

        next();
    } catch (err) {
        // Differentiate between expired vs invalid tokens for better client feedback
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized: token expired' });
        }
        return res.status(401).json({ error: 'Unauthorized: invalid token' });
    }
};

module.exports = authMiddleware;