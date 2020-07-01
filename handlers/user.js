const bcrypt = require('bcrypt')
const { v4: uuid } = require('uuid')
const Boom = require('@hapi/boom')
const db = require('../db')
const { generateKey, getPrefixedEntries } = require('../util')

async function createUser (request) {
  if (!request.payload || !request.payload.name) {
    return Boom.badRequest()
  }
  const { name } = request.payload

  try {
    await db.get(name)
    return Boom.badRequest()
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }

    const password = generateKey()
    const user = {
      id: uuid(),
      name,
      password: await bcrypt.hash(password, 10),
    }

    await db.put(name, user)
    return { password }
  }
}

async function getUser (request) {
  try {
    const user = await db.get(request.params.user)

    delete user.password
    return {
      ...user,
      collections: await getPrefixedEntries(db, `${request.params.user}/`),
    }
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

async function deleteUser (request) {
  try {
    await db.get(request.params.user)
    db.del(request.params.user)
    return 'OK'
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

module.exports = { createUser, getUser, deleteUser }
