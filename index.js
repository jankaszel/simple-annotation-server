const crypto = require('crypto')
const levelup = require('levelup')
const leveldown = require('leveldown')
const Hapi = require('@hapi/hapi')

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

server.start().then(() => {
  const key = crypto.randomBytes(16).toString('hex')
  console.log(`Simple annotation server is running on: ${server.info.uri}
The generated API key is: ${key}`)
})
