const { hash, compare } = require('bcryptjs');

async function generateHash(payload) {
  return hash(payload, 8);
}

async function compareHash(payload, hashed) {
  return compare(payload, hashed);
}

module.exports = {
  generateHash,
  compareHash,
}