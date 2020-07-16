const { app, protocol: globalProtocol } = require('electron')

const P2P_PRIVILEDGES = {
  standard: true,
  secure: true,
  allowServiceWorkers: true,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true
}

const BROWSER_PRIVILEDGES = {
  standard: false,
  secure: true,
  allowServiceWorkers: false,
  supportFetchAPI: true,
  bypassCSP: false,
  corsEnabled: true
}

const createHyperHandler = require('./hyper-protocol')
// const createIPFSHandler = require('./ipfs-protocol')
const createBrowserHandler = require('./browser-protocol')
const createDatHandler = require('./dat-protocol')

module.exports = {
  registerPriviledges,
  setupProtocols
}

function registerPriviledges () {
  globalProtocol.registerSchemesAsPrivileged([
    { scheme: 'hyper', privileges: P2P_PRIVILEDGES },
    { scheme: 'dat', privileges: P2P_PRIVILEDGES },
    { scheme: 'agregore', privileges: BROWSER_PRIVILEDGES }
  ])
}

async function setupProtocols (session) {
  const { protocol: sessionProtocol } = session

  app.setAsDefaultProtocolClient('hyper')
  app.setAsDefaultProtocolClient('dat')
  app.setAsDefaultProtocolClient('agregore')

  const hyperProtocolHandler = await createHyperHandler()
  sessionProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)
  globalProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)

  const browserProtocolHandler = await createBrowserHandler()
  sessionProtocol.registerStreamProtocol('agregore', browserProtocolHandler)
  globalProtocol.registerStreamProtocol('agregore', browserProtocolHandler)

  const datProtocolHandler = await createDatHandler()
  sessionProtocol.registerStreamProtocol('dat', datProtocolHandler)
  globalProtocol.registerStreamProtocol('dat', datProtocolHandler)

/*
  app.setAsDefaultProtocolClient('ipfs')
  const ipfsProtocolHandler = await createIPFSHandler()
  protocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)

  */
}
