const crypto = require('crypto')
const bcrypt = require('bcrypt')
const levelup = require('levelup')
const leveldown = require('leveldown')
const { v4: uuid } = require('uuid')
const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')
const AuthBasic = require('@hapi/basic')
const AuthBearer = require('hapi-auth-bearer-token')

const apiToken = generateKey()

function generateKey (length = 16) {
  return crypto.randomBytes(length).toString('hex')
}

function validateToken (request, token) {
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

async function validateUser (request, username, password, h) {
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

const db = levelup(leveldown('./data'))

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
    validate: validateUser,
  })
  server.auth.default('user')

  await server.register(AuthBearer)
  server.auth.strategy('api-token', 'bearer-access-token', {
    allowQueryToken: true,
    validate: validateToken,
  })

  return server
}

function createAPIRoutes (server) {
  server.route({
    method: ['POST'],
    path: '/users/{name}',
    options: {
      auth: 'api-token',
    },
    handler: async (request, h) => {
      try {
        await db.get(request.params.name)
        return Boom.badRequest()
      } catch (err) {
        const password = generateKey()
        const user = {
          password: await bcrypt.hash(password, 10),
        }

        db.put(request.params.name, JSON.stringify(user))
        return { password }
      }
    },
  })

  server.route({
    method: ['DELETE'],
    path: '/users/{name}',
    options: {
      auth: 'api-token',
    },
    handler: async (request) => {
      try {
        await db.get(request.params.name)
        db.del(request.params.name)
        return 'OK'
      } catch (err) {
        return Boom.notFound()
      }
    },
  })
}

function createAnnotationRoutes (server) {
  server.route({
    method: ['POST'],
    path: '/{user}/{collection}',
    handler: async (request, h) => {
      const collectionKey = `${request.params.user}/${request.params.collection}`
      try {
        await db.get(collectionKey)
        return Boom.badRequest()
      } catch (err) {
        const collection = {
          id: uuid(),
        }
        await db.put(collectionKey, JSON.stringify(collection))
        return collection
      }
    },
  })
}

async function main () {
  const server = await createServer()
  createAPIRoutes(server)
  createAnnotationRoutes(server)

  await server.start()

  console.log(`Simple annotation server is running on: ${server.info.uri}
The generated API token is: ${apiToken}`)
}

main()
