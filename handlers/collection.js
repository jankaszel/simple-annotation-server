const { v4: uuid } = require('uuid')
const Boom = require('@hapi/boom')
const db = require('../db')

async function createCollection (request) {
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
}

module.exports = { createCollection }
