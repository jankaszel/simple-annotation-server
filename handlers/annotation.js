const { v4: uuid } = require('uuid')
const Boom = require('@hapi/boom')
const validateAnnotation = require('validate-web-annotation')
const db = require('../db')
const {
  Container,
  wrapResource,
  expandAnnotation,
  extractId,
} = require('../ldp')

async function createAnnotation (request, h) {
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
  if (!request.payload) {
    return Boom.badRequest('Missing request body')
  }

  const annotation = request.payload
  if (!validateAnnotation(annotation, { optionalId: true })) {
    return Boom.badRequest('Invalid body schema')
  }

  const id = uuid()
  const annotationKey = `${collectionKey}/${id}`
  annotation.id = id

  try {
    await db.get(annotationKey)
    return Boom.badRequest()
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }

    await db.put(annotationKey, annotation)

    const containerInfo = new Container(collectionKey)
    const response = wrapResource(
      h,
      expandAnnotation(annotation, containerInfo)
    )
    return response.code(201).header('location', `/${annotationKey}`)
  }
}

async function getAnnotation (request, h) {
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

  const annotationKey = `${collectionKey}/${request.params.annotation}`
  try {
    const annotation = await db.get(annotationKey)
    const containerInfo = new Container(collectionKey)
    return wrapResource(h, expandAnnotation(annotation, containerInfo))
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

async function updateAnnotation (request, h) {
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

  const annotation = request.payload
  if (!annotation || !validateAnnotation(annotation)) {
    return Boom.badRequest('Invalid body schema')
  }

  const containerInfo = new Container(collectionKey)
  const normalizedId = extractId(annotation.id, containerInfo.url)
  if (!normalizedId) {
    return Boom.badRequest(
      `Annotation ID did not match the expected container IRI: ${containerInfo.url}`
    )
  }
  const contractedAnnotation = {
    ...annotation,
    id: normalizedId,
  }
  const annotationKey = `${collectionKey}/${contractedAnnotation.id}`
  try {
    await db.get(annotationKey)
    await db.put(annotationKey, contractedAnnotation)

    const containerInfo = new Container(collectionKey)
    return wrapResource(
      h,
      expandAnnotation(contractedAnnotation, containerInfo)
    )
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

async function deleteAnnotation (request, h) {
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

  const annotationKey = `${collectionKey}/${request.params.annotation}`
  try {
    await db.get(annotationKey)
    await db.del(annotationKey)
    return h.response().code(204)
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

module.exports = {
  createAnnotation,
  getAnnotation,
  updateAnnotation,
  deleteAnnotation,
}
