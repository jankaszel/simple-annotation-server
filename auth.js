const bcrypt = require('bcrypt')
const db = require('./db')

function validateToken (apiToken) {
  return (request, token) => {
    if (token === apiToken) {
      return {
        isValid: true,
        credentials: {
          token: apiToken,
        },
      }
    } else {
      return { isValid: false, credentials: null }
    }
  }
}

async function validateUser (request, username, password) {
  try {
    const value = await db.get(username)
    const user = JSON.parse(value)

    if (await bcrypt.compare(password, user.password)) {
      return {
        isValid: true,
        credentials: {
          name: username,
        },
      }
    } else {
      return { isValid: false, credentials: null }
    }
  } catch (err) {
    return { isValid: false, credentials: null }
  }
}

module.exports = { validateToken, validateUser }
