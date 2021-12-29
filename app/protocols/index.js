const { app, protocol: globalProtocol } = require('electron')

const P2P_PRIVILEDGES = {
  standard: true,
  secure: true,
  allowServiceWorkers: true,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true,
  stream: true
}

const BROWSER_PRIVILEDGES = {
  standard: false,
  secure: true,
  allowServiceWorkers: false,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true
}

const LOW_PRIVILEDGES = {
  standard: false,
  secure: false,
  allowServiceWorkers: false,
  supportFetchAPI: false,
  bypassCSP: false,
  corsEnabled: true
}

const {
  ipfsOptions,
  ssbOptions,
  hyperOptions,
  btOptions,
  gunOptions
} = require('../config')

/*
TODO: Refactor protocol registration code
class Protocols {
  constructor () {
    this.fetches = new Map()
  }

  register (name, fetch) {
    this.fetches
  }

  async getFetch (name) {
  }
}
*/

const createHyperHandler = require('./hyper-protocol')
const createSsbHandler = require('./ssb-protocol')
const createIPFSHandler = require('./ipfs-protocol')
const createBrowserHandler = require('./browser-protocol')
const createGeminiHandler = require('./gemini-protocol')
const createBTHandler = require('./bt-protocol')
const createMagnetHandler = require('./magnet-protocol')
const createGunHandler = require('./gun-protocol')

module.exports = {
  registerPriviledges,
  setupProtocols
}

function registerPriviledges() {
  globalProtocol.registerSchemesAsPrivileged([
    { scheme: 'hyper', privileges: P2P_PRIVILEDGES },
    // { scheme: 'ssb', privileges: P2P_PRIVILEDGES }, // presumably errors because ssb uri are not url safe
    { scheme: 'gemini', privileges: P2P_PRIVILEDGES },
    { scheme: 'ipfs', privileges: P2P_PRIVILEDGES },
    { scheme: 'ipns', privileges: P2P_PRIVILEDGES },
    { scheme: 'bittorrent', privileges: P2P_PRIVILEDGES },
    { scheme: 'gun', privileges: P2P_PRIVILEDGES },
    { scheme: 'agregore', privileges: BROWSER_PRIVILEDGES },
    { scheme: 'magnet', privileges: LOW_PRIVILEDGES }
  ])
}

async function setupProtocols(session) {
  const { protocol: sessionProtocol } = session

  app.setAsDefaultProtocolClient('hyper')
  app.setAsDefaultProtocolClient('ssb')
  app.setAsDefaultProtocolClient('agregore')
  app.setAsDefaultProtocolClient('gemini')
  app.setAsDefaultProtocolClient('ipfs')
  app.setAsDefaultProtocolClient('ipns')
  app.setAsDefaultProtocolClient('bittorrent')
  app.setAsDefaultProtocolClient('gun')

  const browserProtocolHandler = await createBrowserHandler()
  sessionProtocol.registerStreamProtocol('agregore', browserProtocolHandler)
  globalProtocol.registerStreamProtocol('agregore', browserProtocolHandler)

  const hyperProtocolHandler = await createHyperHandler(hyperOptions, session)
  sessionProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)
  globalProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)

  const ssbProtocolHandler = await createSsbHandler(ssbOptions, session)
  sessionProtocol.registerStreamProtocol('ssb', ssbProtocolHandler)
  globalProtocol.registerStreamProtocol('ssb', ssbProtocolHandler)

  const geminiProtocolHandler = await createGeminiHandler()
  sessionProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)
  globalProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)

  const ipfsProtocolHandler = await createIPFSHandler(ipfsOptions, session)
  sessionProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  sessionProtocol.registerStreamProtocol('ipns', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipns', ipfsProtocolHandler)

  const btHandler = await createBTHandler(btOptions, session)
  sessionProtocol.registerStreamProtocol('bittorrent', btHandler)
  globalProtocol.registerStreamProtocol('bittorrent', btHandler)

  const magnetHandler = await createMagnetHandler()
  sessionProtocol.registerStreamProtocol('magnet', magnetHandler)
  globalProtocol.registerStreamProtocol('magnet', magnetHandler)

  const gunHandler = await createGunHandler(gunOptions, session)
  sessionProtocol.registerStreamProtocol('gun', gunHandler)
  globalProtocol.registerStreamProtocol('gun', gunHandler)
}
