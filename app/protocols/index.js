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

const { ipfsOptions } = require('../config')

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
const createIPFSHandler = require('./ipfs-protocol')
const createBrowserHandler = require('./browser-protocol')
const createDatHandler = require('./dat-protocol')
const createGeminiHandler = require('./gemini-protocol')

module.exports = {
  registerPriviledges,
  setupProtocols
}

function registerPriviledges () {
  globalProtocol.registerSchemesAsPrivileged([
    { scheme: 'hyper', privileges: P2P_PRIVILEDGES },
    { scheme: 'dat', privileges: P2P_PRIVILEDGES },
    { scheme: 'gemini', privileges: P2P_PRIVILEDGES },
    { scheme: 'ipfs', privileges: P2P_PRIVILEDGES },
    { scheme: 'ipns', privileges: P2P_PRIVILEDGES },
    { scheme: 'agregore', privileges: BROWSER_PRIVILEDGES }
  ])
}

async function setupProtocols (session) {
  const { protocol: sessionProtocol } = session

  app.setAsDefaultProtocolClient('hyper')
  app.setAsDefaultProtocolClient('dat')
  app.setAsDefaultProtocolClient('agregore')
  app.setAsDefaultProtocolClient('gemini')
  app.setAsDefaultProtocolClient('ipfs')
  app.setAsDefaultProtocolClient('ipns')

  const hyperProtocolHandler = await createHyperHandler()
  sessionProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)
  globalProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)

  const browserProtocolHandler = await createBrowserHandler()
  sessionProtocol.registerStreamProtocol('agregore', browserProtocolHandler)
  globalProtocol.registerStreamProtocol('agregore', browserProtocolHandler)

  const datProtocolHandler = await createDatHandler()
  sessionProtocol.registerStreamProtocol('dat', datProtocolHandler)
  globalProtocol.registerStreamProtocol('dat', datProtocolHandler)

  const geminiProtocolHandler = await createGeminiHandler()
  sessionProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)
  globalProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)

  const ipfsProtocolHandler = await createIPFSHandler(ipfsOptions)
  sessionProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  sessionProtocol.registerStreamProtocol('ipns', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipns', ipfsProtocolHandler)
}
