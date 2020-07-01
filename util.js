const crypto = require('crypto')

function generateKey (length = 16) {
  return crypto.randomBytes(length).toString('hex')
}

module.exports = { generateKey }
