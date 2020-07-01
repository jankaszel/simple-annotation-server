const levelup = require('levelup')
const leveldown = require('leveldown')

const db = levelup(leveldown('./data'))

module.exports = db
