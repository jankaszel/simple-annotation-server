const crypto = require('crypto')
const bcrypt = require('bcrypt')
const levelup = require('levelup')
const leveldown = require('leveldown')
const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')

function generateKey (length = 16) {
  return crypto.randomBytes(length).toString('hex')
}

const apiKey = generateKey()
const db = levelup(leveldown('./data'))
const server = Hapi.server({
  port: process.env.PORT || 3000,
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

server.route({
  method: ['POST'],
  path: '/users/{name}',
  handler: async (request, h) => {
    if (request.query.token !== apiKey) {
      return Boom.unauthorized()
    }

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
  handler: async (request) => {
    if (request.query.token !== apiKey) {
      return Boom.unauthorized()
    }

    try {
      await db.get(request.params.name)
      db.del(request.params.name)
      return 'OK'
    } catch (err) {
      return Boom.notFound()
    }
  },
})

server.start().then(() => {
  console.log(`Simple annotation server is running on: ${server.info.uri}
The generated API key is: ${apiKey}`)
})
