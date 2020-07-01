const crypto = require('crypto')

function generateKey (length = 16) {
  return crypto.randomBytes(length).toString('hex')
}

function getPrefixedEntries (db, prefix) {
  const entries = []

  return new Promise((resolve, reject) => {
    const stream = db.createReadStream({ gt: prefix })
    stream.on('data', (entry) => {
      if (!entry.key.startsWith(prefix)) {
        stream.destroy()
        return
      }
      entries.push(entry.value)
    })
    stream.on('error', (err) => reject(err))
    stream.on('close', () => resolve(entries))
    stream.on('end', () => resolve(entries))
  })
}

module.exports = { generateKey, getPrefixedEntries }
