const crypto = require('crypto')
const bcrypt = require('bcrypt')
const levelup = require('levelup')
const leveldown = require('leveldown')
const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')
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
        return Boom.forbidden()
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

async function main () {
  const server = await createServer()
  createAPIRoutes(server)

  await server.start()

  console.log(`Simple annotation server is running on: ${server.info.uri}
The generated API token is: ${apiToken}`)
}

main()
