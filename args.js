const os = require('os')
const parseArgs = require('minimist')

const args = parseArgs(process.argv.slice(2), {
  boolean: ['x', 'ssl'],
  string: ['port', 'host'],
  alias: {
    port: 'p',
    ssl: 's',
  },
  default: {
    port: 3000,
    x: false,
    ssl: false,
    host: undefined,
  },
})

const port = Number.parseInt(args.port, 10)
if (!Number.isInteger(port)) {
  console.log('Usage: simple-annotation-server [-p <port>] [-x]')
  process.exit(1)
}

const host = args.host || `${os.hostname()}:${port}`

module.exports = {
  host,
  port,
  open: args.x,
  ssl: args.ssl,
}
