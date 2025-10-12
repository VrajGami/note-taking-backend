// config.js
// Centralized configuration loader. Loads environment variables and validates
// required secrets. For local development, create a `.env` file (see `.env.example`).

const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root if present
dotenv.config({ path: path.resolve(__dirname, '.env') });

const getEnv = (key, { required = false, defaultValue } = {}) => {
  const val = process.env[key];
  if ((val === undefined || val === '') && required && defaultValue === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val === undefined || val === '' ? defaultValue : val;
};

const JWT_SECRET = getEnv('JWT_SECRET', { required: true });
const JWT_EXPIRES_IN = getEnv('JWT_EXPIRES_IN', { defaultValue: '1h' });
const SALT_ROUNDS = parseInt(getEnv('SALT_ROUNDS', { defaultValue: '10' }), 10);

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SALT_ROUNDS,
};
