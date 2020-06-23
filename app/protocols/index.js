const { app, protocol } = require('electron')

const P2P_PRIVILEDGES = {
  standard: true,
  secure: true,
  allowServiceWorkers: true,
  supportFetchAPI: true,
  bypassCSP: true
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
  protocol.registerSchemesAsPrivileged([
    { scheme: 'hyper', privileges: P2P_PRIVILEDGES },
    { scheme: 'dat', privileges: P2P_PRIVILEDGES }
  ])
}

async function setupProtocols () {
  app.setAsDefaultProtocolClient('hyper')
  app.setAsDefaultProtocolClient('dat')

  const hyperProtocolHandler = await createHyperHandler()
  protocol.registerStreamProtocol('hyper', hyperProtocolHandler)

  const browserProtocolHandler = await createBrowserHandler()
  protocol.registerStreamProtocol('agregore-browser', browserProtocolHandler)

  const datProtocolHandler = await createDatHandler()
  protocol.registerStreamProtocol('dat', datProtocolHandler)

/*
  app.setAsDefaultProtocolClient('ipfs')
  const ipfsProtocolHandler = await createIPFSHandler()
  protocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)

  */
}
