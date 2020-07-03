const escapeString = require('escape-string-regexp')
const Boom = require('@hapi/boom')
const etag = require('etag')
const { host, ssl } = require('./args')

function extractId (annotationId, containerUrl) {
  const escapedUrl = escapeString(containerUrl)
  const pattern = new RegExp(`^${escapedUrl}\/([0-9a-z-]+)$`)
  const matches = annotationId.match(pattern)
  return !matches ? null : matches[1]
}

function expandAnnotation (annotation, containerInfo) {
  return {
    ...annotation,
    id: `${containerInfo.url}/${annotation.id}`,
  }
}

function contractAnnotation (annotation, containerInfo) {
  return {
    ...annotation,
    id: extractId(annotation.id, containerInfo.url),
  }
}

class Container {
  constructor (containerPath) {
    this.containerPath = containerPath
  }

  get url () {
    return `${ssl ? 'https' : 'http'}://${host}/${this.containerPath}`
  }
}

class PagedContainer extends Container {
  constructor (containerPath, getPage, total, pageSize) {
    super(containerPath)

    if (Array.isArray(getPage)) {
      const items = getPage
      this._getPage = () => items
      this.total = items.length
      this.pageSize = Infinity
    } else {
      this._getPage = getPage
      this.total = total
      this.pageSize = pageSize
    }
  }

  getPage (pageNumber) {
    return this._getPage(pageNumber, this.pageSize)
  }

  get lastPage () {
    return this.pageSize === Infinity
      ? 0
      : Math.floor(this.total / this.pageSize)
  }
}

function createPage (h, container, pageNumber, iris) {
  if (pageNumber > container.lastPage) {
    return Boom.notFound()
  }

  const items = container.getPage(pageNumber)
  const page = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: `${container.url}/?page=${pageNumber}&iris=${iris ? 1 : 0}`,
    type: 'AnnotationPage',
    partOf: {
      id: `${container.url}/?iris=${iris ? 1 : 0}`,
      total: container.total,
      modified: '2016-07-20T12:00:00Z',
    },
    startIndex: pageNumber === 0 ? 0 : container.pageSize * pageNumber,
    items: iris ? items.map((item) => item.id) : items,
  }

  const response = h.response(page)
  response.type(
    'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"'
  )
  response.header('allow', 'HEAD, GET, OPTIONS')

  return response
}

function createContainer (h, container, iris) {
  const body = {
    '@context': [
      'http://www.w3.org/ns/anno.jsonld',
      'http://www.w3.org/ns/ldp.jsonld',
    ],
    id: `${container.url}/?iris=${iris ? 1 : 0}`,
    type: ['BasicContainer', 'AnnotationCollection'],
    total: container.total,
    modified: '2016-07-20T12:00:00Z',
    label: 'tbd',
    first: `${container.url}/?iris=${iris ? 1 : 0}&page=0`,
    ...(container.lastPage > 0 && {
      last: `${container.url}/?iris=${iris ? 1 : 0}&page=${container.lastPage}`,
    }),
  }

  const response = h.response(body)
  response.header('link', [
    '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
    '<http://www.w3.org/TR/annotation-protocol/>; rel="http://www.w3.org/ns/ldp#constrainedBy"',
  ])
  response.header(
    'Accept-Post',
    'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"'
  )
  response.type(
    'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"'
  )
  response.header('allow', 'HEAD, GET, POST, OPTIONS')
  response.etag(etag(JSON.stringify(body)))

  return response
}

function wrapResource (h, annotation) {
  const response = h.response(annotation)
  response.etag(etag(JSON.stringify(annotation)))
  response.type(
    'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"'
  )
  response.header('allow', 'OPTIONS,HEAD,GET,PUT,DELETE')
  response.header('link', '<http://www.w3.org/ns/ldp#Resource>; rel="type"')

  return response
}

module.exports = {
  Container,
  PagedContainer,
  createPage,
  createContainer,
  wrapResource,
  expandAnnotation,
  contractAnnotation,
  extractId,
}
