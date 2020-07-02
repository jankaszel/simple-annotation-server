const os = require('os')
const port = process.env.PORT || 3000

module.exports = {
  host: `${os.hostname()}:${port}`,
  port,
  ssl: false,
}
