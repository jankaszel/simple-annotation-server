const bcrypt = require('bcrypt')
const db = require('./db')

const createAuthDummy = (schemeName) => {
  const authDummy = {
    name: `DummyAuthentication-${schemeName}`,
    register (server, options) {
      server.auth.scheme(schemeName, (server, strategyOptions) => ({
        authenticate (request, h) {
          return h.authenticated({ credentials: { foo: 'bar' } })
        },
      }))
    },
  }
  authDummy.register.attributes = {
    name: 'hapi-auth-dummy',
  }
  return authDummy
}

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

module.exports = {
  createAuthDummy,
  validateToken,
  validateUser,
}
