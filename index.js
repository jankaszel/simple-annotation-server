const crypto = require('crypto')
const Hapi = require('@hapi/hapi')
const AuthBasic = require('@hapi/basic')
const AuthBearer = require('hapi-auth-bearer-token')
const { validateToken, validateUser } = require('./auth')
const { createUser, getUser, deleteUser } = require('./handlers/user')
const { createCollection } = require('./handlers/collection')
const { generateKey } = require('./util')

const apiToken = generateKey()

function addHandler (server, path, method, handler, options = {}) {
  server.route({
    method: Array.isArray(method) ? method : [method],
    path,
    options,
    handler,
  })
}

async function createServer (port = 3000) {
  const server = Hapi.server({
    port,
    router: {
      stripTrailingSlash: true,
    },
    routes: {
      cors: {
        origin: ['*'],
        exposedHeaders: ['link', 'allow', 'etag'],
      },
    },
  })

  await server.register(AuthBasic)
  server.auth.strategy('user', 'basic', {
    validate: validateUser('user'),
  })
  server.auth.default('user')

  await server.register(AuthBearer)
  server.auth.strategy('api-token', 'bearer-access-token', {
    allowQueryToken: true,
    validate: validateToken(apiToken),
  })

  return server
}

async function main () {
  const server = await createServer()

  addHandler(server, '/', 'POST', createUser, { auth: 'api-token' })
  addHandler(server, '/{user}', 'GET', getUser, {
    auth: {
      strategies: ['api-token', 'user'],
    },
  })
  addHandler(server, '/{user}', 'DELETE', deleteUser, {
    auth: {
      strategies: ['api-token', 'user'],
    },
  })

  addHandler(server, '/{user}', 'POST', createCollection)

  await server.start()

  console.log(`Simple annotation server is running on: ${server.info.uri}
The generated API token is: ${apiToken}`)
}

main()
