const bcrypt = require('bcrypt')
const { v4: uuid } = require('uuid')
const Boom = require('@hapi/boom')
const db = require('../db')
const { generateKey } = require('../util')

async function createUser (request) {
  try {
    await db.get(request.params.user)
    return Boom.badRequest()
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }

    const password = generateKey()
    const user = {
      id: uuid(),
      name: request.params.user,
      password: await bcrypt.hash(password, 10),
    }

    db.put(request.params.user, JSON.stringify(user))
    return { password }
  }
}

async function getUser (request) {
  try {
    const value = await db.get(request.params.user)
    const user = JSON.parse(value)

    delete user.password
    return user
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
