// scripts/generate-secret.js
// Generates a secure random secret suitable for JWT or other symmetric secrets.

const crypto = require('crypto');

function generateSecret(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64');
}

if (require.main === module) {
  console.log(generateSecret());
}

module.exports = generateSecret;
