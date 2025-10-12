// utils/tokenStore.js
// Simple in-memory token blacklist with TTL. Intended for dev or single-process use.

const blacklist = new Map(); // token => expiryTimestamp (ms)

// Add token to blacklist until its expiry (expiry is a timestamp in ms)
function blacklistToken(token, expiryTimestamp) {
  if (!token || !expiryTimestamp) return;
  blacklist.set(token, expiryTimestamp);
}

// Check whether a token is blacklisted
function isTokenBlacklisted(token) {
  if (!token) return false;
  const expiry = blacklist.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    // token expired, remove from blacklist
    blacklist.delete(token);
    return false;
  }
  return true;
}

// Periodic cleanup to remove expired entries
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of blacklist.entries()) {
    if (now > expiry) blacklist.delete(token);
  }
}, 1000 * 60); // cleanup every minute

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
};
