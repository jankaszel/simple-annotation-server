const os = require('os')
const parseArgs = require('minimist')

const args = parseArgs(process.argv.slice(2), {
  boolean: ['x', 'ssl', 'help', 'cors'],
  string: ['port', 'host'],
  alias: {
    help: 'h',
    port: 'p',
    ssl: 's',
  },
  default: {
    cors: false,
    host: undefined,
    port: 3000,
    ssl: false,
    x: false,
  },
})

const port = Number.parseInt(args.port, 10)
if (!Number.isInteger(port)) {
  console.log('Usage: simple-annotation-server [-p <port>] [-x]')
  process.exit(1)
}

const host = args.host || `${os.hostname()}:${port}`

module.exports = {
  cors: args.cors,
  host,
  port,
  open: args.x,
  ssl: args.ssl,
  help: args.help,
}
