const Hapi = require('@hapi/hapi')
const AuthBasic = require('@hapi/basic')
const AuthBearer = require('hapi-auth-bearer-token')
const { createAuthDummy, validateToken, validateUser } = require('./auth')
const { createUser, getUser, deleteUser } = require('./handlers/user')
const {
  createCollection,
  getCollection,
  deleteCollection,
} = require('./handlers/collection')
const {
  createAnnotation,
  getAnnotation,
  updateAnnotation,
  deleteAnnotation,
} = require('./handlers/annotation')
const { generateKey } = require('./util')
const args = require('./args')

const apiToken = generateKey()

function addHandler (server, path, method, handler, options = {}) {
  server.route({
    method: Array.isArray(method) ? method : [method],
    path,
    options,
    handler,
  })
}

async function createServer (opts = {}) {
  const port = opts.port || 3000,
    open = !!opts.open || false

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

async function main () {
  const server = await createServer(args)

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
  addHandler(server, '/{user}/{collection}', 'POST', createAnnotation)
  addHandler(server, '/{user}/{collection}', 'GET', getCollection)
  addHandler(server, '/{user}/{collection}', 'DELETE', deleteCollection)
  addHandler(server, '/{user}/{collection}/{annotation}', 'GET', getAnnotation)
  addHandler(
    server,
    '/{user}/{collection}/{annotation}',
    'PUT',
    updateAnnotation
  )
  addHandler(
    server,
    '/{user}/{collection}/{annotation}',
    'DELETE',
    deleteAnnotation
  )

  await server.start()

  console.log(`Simple annotation server is running on: ${server.info.uri}`)
  console.log(
    args.open
      ? 'The server is running openly without authentication.'
      : `The generated API token is: ${apiToken}`
  )
}

main()
