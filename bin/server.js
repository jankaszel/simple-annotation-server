#!/usr/bin/env node
const { createServer } = require('../server')
const { createUser, getUser, deleteUser } = require('../handlers/user')
const {
  createCollection,
  getCollection,
  deleteCollection,
} = require('../handlers/collection')
const {
  createAnnotation,
  getAnnotation,
  updateAnnotation,
  deleteAnnotation,
} = require('../handlers/annotation')
const { generateKey } = require('../util')
const args = require('../args')

function addHandler (server, path, method, handler, options = {}) {
  server.route({
    method: Array.isArray(method) ? method : [method],
    path,
    options,
    handler,
  })
}

async function main () {
  if (args.help) {
    console.log(`Usage: $ simple-annotation-server
  
Options:
 -p --port PORT  TCP port to serve on (defaults to 3000)
 --host HOST     Full public host (e.g., www.example.com:5000)
 -s --ssl        Runs behind an SSL proxy
 -x              Don't require any authentication`)
    process.exit(0)
  }

  const apiToken = generateKey()
  const server = await createServer({ ...args, apiToken })

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
