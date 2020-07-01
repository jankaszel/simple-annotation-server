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

function validateUser (opts = {}) {
  const userParam = opts.userParam || 'user'
  return async (request, username, password) => {
    try {
      if (
        !request.params[userParam] ||
        request.params[userParam] !== username
      ) {
        return { isValid: false, credentials: null }
      }
      const user = await db.get(username)

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
}

module.exports = { validateToken, validateUser }
