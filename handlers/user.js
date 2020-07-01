const bcrypt = require('bcrypt')
const db = require('../db')
const { generateKey } = require('../util')

async function createUser (request) {
  try {
    await db.get(request.params.user)
    return Boom.badRequest()
  } catch (err) {
    const password = generateKey()
    const user = {
      password: await bcrypt.hash(password, 10),
    }

    db.put(request.params.user, JSON.stringify(user))
    return { password }
  }
}

async function deleteUser (request) {
  try {
    await db.get(request.params.user)
    db.del(request.params.user)
    return 'OK'
  } catch (err) {
    return Boom.notFound()
  }
}

module.exports = { createUser, deleteUser }
