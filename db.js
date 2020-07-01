const level = require('level')
const db = level('./data', { valueEncoding: 'json' })
module.exports = db
