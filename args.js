const os = require('os')
const port = 3000

module.exports = {
  host: `${os.hostname()}:${port}`,
  port,
  ssl: false,
}
