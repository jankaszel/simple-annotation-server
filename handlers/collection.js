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

async function createCollection (request, h) {
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
    return h
      .response(collection)
      .code(201)
      .header('location', `/${collectionKey}`)
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
    const annotations = (await getPrefixedEntries(db, `${collectionKey}/`)).map(
      (entry) => entry.value
    )
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

async function deleteCollection (request, h) {
  const collectionKey = `${request.params.user}/${request.params.collection}`
  try {
    await db.get(collectionKey)

    const entries = await getPrefixedEntries(db, `${collectionKey}/`)
    for (const { key } of entries) {
      await db.del(key)
    }

    await db.del(collectionKey)
    return h.response().code(204)
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

module.exports = { createCollection, getCollection, deleteCollection }
