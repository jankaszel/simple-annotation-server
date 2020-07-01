const { v4: uuid } = require('uuid')
const Boom = require('@hapi/boom')
const db = require('../db')

async function createCollection (request) {
  if (!request.payload || !request.payload.name) {
    return Boom.badRequest()
  }
  const { name } = request.payload
  const collectionKey = `${request.params.user}/${name}`
  try {
    await db.get(collectionKey)
    return Boom.badRequest()
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }

    const collection = {
      id: uuid(),
      name,
    }
    await db.put(collectionKey, JSON.stringify(collection))
    return collection
  }
}

module.exports = { createCollection }
