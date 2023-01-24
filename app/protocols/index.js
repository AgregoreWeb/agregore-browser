import { app, protocol as globalProtocol } from 'electron'
import Config from '../config.js'

import createHyperHandler from './hyper-protocol.js'
import createSsbHandler from './ssb-protocol.js'
import createIPFSHandler from './ipfs-protocol.js'
import createBrowserHandler from './browser-protocol.js'
import createGeminiHandler from './gemini-protocol.js'
import createBTHandler from './bt-protocol.js'
import createMagnetHandler from './magnet-protocol.js'

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

const {
  ipfsOptions,
  ssbOptions,
  hyperOptions,
  btOptions
} = Config

const onCloseHandlers = []

export async function close () {
  await Promise.all(onCloseHandlers.map((handler) => handler()))
}

export function registerPrivileges () {
  globalProtocol.registerSchemesAsPrivileged([
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
}

export async function setupProtocols (session) {
  const { protocol: sessionProtocol } = session

  app.setAsDefaultProtocolClient('agregore')
  app.setAsDefaultProtocolClient('hyper')
  app.setAsDefaultProtocolClient('ssb')
  app.setAsDefaultProtocolClient('gemini')
  app.setAsDefaultProtocolClient('ipfs')
  app.setAsDefaultProtocolClient('ipns')
  app.setAsDefaultProtocolClient('ipld')
  app.setAsDefaultProtocolClient('pubsub')
  app.setAsDefaultProtocolClient('bittorrent')
  app.setAsDefaultProtocolClient('bt')

  const { handler: browserProtocolHandler } = await createBrowserHandler()
  sessionProtocol.registerStreamProtocol('agregore', browserProtocolHandler)
  globalProtocol.registerStreamProtocol('agregore', browserProtocolHandler)

  const {
    handler: hyperProtocolHandler,
    close: closeHyper
  } = await createHyperHandler(hyperOptions, session)
  onCloseHandlers.push(closeHyper)
  sessionProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)
  globalProtocol.registerStreamProtocol('hyper', hyperProtocolHandler)

  const { handler: ssbProtocolHandler } = await createSsbHandler(ssbOptions, session)
  sessionProtocol.registerStreamProtocol('ssb', ssbProtocolHandler)
  globalProtocol.registerStreamProtocol('ssb', ssbProtocolHandler)

  const { handler: geminiProtocolHandler } = await createGeminiHandler()
  sessionProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)
  globalProtocol.registerStreamProtocol('gemini', geminiProtocolHandler)

  const {
    handler: ipfsProtocolHandler,
    close: closeIPFS
  } = await createIPFSHandler(ipfsOptions, session)
  onCloseHandlers.push(closeIPFS)
  sessionProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)
  sessionProtocol.registerStreamProtocol('ipns', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipns', ipfsProtocolHandler)
  sessionProtocol.registerStreamProtocol('ipld', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('ipld', ipfsProtocolHandler)
  sessionProtocol.registerStreamProtocol('pubsub', ipfsProtocolHandler)
  globalProtocol.registerStreamProtocol('pubsub', ipfsProtocolHandler)

  const {
    handler: btHandler,
    close: closeBT
  } = await createBTHandler(btOptions, session)
  onCloseHandlers.push(closeBT)
  sessionProtocol.registerStreamProtocol('bittorrent', btHandler)
  globalProtocol.registerStreamProtocol('bittorrent', btHandler)
  sessionProtocol.registerStreamProtocol('bt', btHandler)
  globalProtocol.registerStreamProtocol('bt', btHandler)

  const magnetHandler = await createMagnetHandler()
  sessionProtocol.registerStreamProtocol('magnet', magnetHandler)
  globalProtocol.registerStreamProtocol('magnet', magnetHandler)
}
