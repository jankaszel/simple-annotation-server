const { v4: uuid } = require('uuid')
const Boom = require('@hapi/boom')
const db = require('../db')
const {
  Container,
  PagedContainer,
  createPage,
  createContainer,
  expandAnnotation,
} = require('../ldp')
const { getPrefixedEntries } = require('../util')

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
    await db.put(collectionKey, collection)
    return collection
  }
}

async function getCollection (request, h) {
  const collectionKey = `${request.params.user}/${request.params.collection}`
  try {
    await db.get(collectionKey)
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }

  const pageNumber = request.query.page
    ? Number.parseInt(request.query.page)
    : null
  const iris = request.query.iris === '1'
  const containerInfo = new Container(collectionKey)

  try {
    const annotations = await getPrefixedEntries(db, `${collectionKey}/`)
    const collection = new PagedContainer(
      collectionKey,
      annotations.map((annotation) =>
        expandAnnotation(annotation, containerInfo)
      )
    )

    if (pageNumber !== null) {
      return createPage(h, collection, pageNumber, iris)
    }
    return createContainer(h, collection, iris)
  } catch (err) {
    if (!err.notFound) {
      if (!err.notFound) {
        console.error(request.method, request.path, err)
        return Boom.internal()
      }
      return Boom.notFound()
    }
  }
}

module.exports = { createCollection, getCollection }
