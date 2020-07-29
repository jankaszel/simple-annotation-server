const Hapi = require('@hapi/hapi')
const AuthBasic = require('@hapi/basic')
const AuthBearer = require('hapi-auth-bearer-token')
const { createAuthDummy, validateToken, validateUser } = require('./auth')
const { generateKey } = require('./util')

async function createServer (opts = {}) {
  const port = opts.port || 3000
  const open = !!opts.open || false
  const apiToken = opts.apiToken || generateKey()

  const server = Hapi.server({
    port,
    router: {
      stripTrailingSlash: true,
    },
    routes: {
      cors: {
        origin: ['*'],
        credentials: true,
        exposedHeaders: ['link', 'allow', 'etag'],
      },
    },
  })

  await server.register(open ? createAuthDummy('basic') : AuthBasic)
  server.auth.strategy('user', 'basic', {
    validate: validateUser({ userParam: 'user' }),
  })
  server.auth.default('user')

  await server.register(
    open ? createAuthDummy('bearer-access-token') : AuthBearer
  )
  server.auth.strategy('api-token', 'bearer-access-token', {
    allowQueryToken: true,
    validate: validateToken(apiToken),
  })

  return server
}

module.exports = { createServer }
