const { protocol } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')

const P2P_PRIVILEGES = {
  standard: true,
  secure: true,
  allowServiceWorkers: true,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true,
  stream: true
}

const BROWSER_PRIVILEGES = {
  standard: false,
  secure: true,
  allowServiceWorkers: false,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true
}

const LOW_PRIVILEGES = {
  standard: false,
  secure: false,
  allowServiceWorkers: false,
  supportFetchAPI: false,
  bypassCSP: false,
  corsEnabled: true
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'https+raw', privileges: P2P_PRIVILEGES },
  { scheme: 'hyper', privileges: P2P_PRIVILEGES },
  { scheme: 'gemini', privileges: P2P_PRIVILEGES },
  { scheme: 'ipfs', privileges: P2P_PRIVILEGES },
  { scheme: 'ipns', privileges: P2P_PRIVILEGES },
  { scheme: 'ipld', privileges: P2P_PRIVILEGES },
  { scheme: 'pubsub', privileges: P2P_PRIVILEGES },
  { scheme: 'bittorrent', privileges: P2P_PRIVILEGES },
  { scheme: 'bt', privileges: P2P_PRIVILEGES },
  { scheme: 'ssb', privileges: P2P_PRIVILEGES },
  { scheme: 'agregore', privileges: BROWSER_PRIVILEGES },
  { scheme: 'magnet', privileges: LOW_PRIVILEGES }
])

const indexFile = path.join(__dirname, 'index.js')
  .replace(`.asar${path.sep}`, `.asar.unpacked${path.sep}`)

import(pathToFileURL(indexFile)).catch((e) => {
  console.error(e.stack)
  process.exit(1)
})
