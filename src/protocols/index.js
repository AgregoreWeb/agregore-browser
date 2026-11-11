import { app, protocol as globalProtocol } from 'electron'
import Config from '../config.js'

import createHyperHandler from './hyper-protocol.js'
import createSsbHandler from './ssb-protocol.js'
import createIPFSHandler from './ipfs-protocol.js'
import createBrowserHandler from './browser-protocol.js'
import createGeminiHandler from './gemini-protocol.js'
import createBTHandler from './bt-protocol.js'
import createMagnetHandler from './magnet-protocol.js'
import createRawHTTPSHandler from './raw-http-protocol.js'
import createWeb3Handler from './web3-protocol.js'
import createDIDHandler from './did-protocol.js'

/** @import { LocalSiteTracker } from '../localsites.js' */

/** @import { LocalSiteTracker } from '../localsites.js' */

const {
  ipfsOptions,
  ssbOptions,
  hyperOptions,
  web3Options,
  btOptions,
  didOptions
} = Config

/** @type {(() => Promise<void>|void)[]} */
const onCloseHandlers = []

export async function close () {
  await Promise.all(onCloseHandlers.map((handler) => handler()))
}

export function setAsDefaultProtocolClient () {
  console.log('Setting as default handlers')

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
  app.setAsDefaultProtocolClient('web3')
}

/**
 * Set up protocols on a given session
 * @param {import('electron').Session} session
 * @param {LocalSiteTracker} tracker
 */
export async function setupProtocols (session, tracker) {
  const { protocol: sessionProtocol } = session

  const { handler: browserProtocolHandler } = await createBrowserHandler()
  sessionProtocol.handle('agregore', browserProtocolHandler)
  globalProtocol.handle('agregore', browserProtocolHandler)
  sessionProtocol.handle('browser', browserProtocolHandler)
  globalProtocol.handle('browser', browserProtocolHandler)

  console.log('Registering hyper handlers')

  const {
    handler: hyperProtocolHandler,
    close: closeHyper
  } = await createHyperHandler(hyperOptions, session, tracker)
  onCloseHandlers.push(closeHyper)
  sessionProtocol.handle('hyper', hyperProtocolHandler)
  globalProtocol.handle('hyper', hyperProtocolHandler)

  console.log('Registering ssb handlers')

  const { handler: ssbProtocolHandler } = await createSsbHandler(ssbOptions, session)
  sessionProtocol.handle('ssb', ssbProtocolHandler)
  globalProtocol.handle('ssb', ssbProtocolHandler)

  console.log('Registering gemini handlers')

  const { handler: geminiProtocolHandler } = await createGeminiHandler()
  sessionProtocol.handle('gemini', geminiProtocolHandler)
  globalProtocol.handle('gemini', geminiProtocolHandler)

  console.log('Registering IPFS handlers')

  const {
    handler: ipfsProtocolHandler,
    close: closeIPFS
  } = await createIPFSHandler(ipfsOptions, session, tracker)
  onCloseHandlers.push(closeIPFS)
  sessionProtocol.handle('ipfs', ipfsProtocolHandler)
  globalProtocol.handle('ipfs', ipfsProtocolHandler)
  sessionProtocol.handle('ipns', ipfsProtocolHandler)
  globalProtocol.handle('ipns', ipfsProtocolHandler)
  sessionProtocol.handle('ipld', ipfsProtocolHandler)
  globalProtocol.handle('ipld', ipfsProtocolHandler)
  sessionProtocol.handle('pubsub', ipfsProtocolHandler)
  globalProtocol.handle('pubsub', ipfsProtocolHandler)

  console.log('Registering bittorrent handlers')

  const {
    handler: btHandler,
    close: closeBT
  } = await createBTHandler(btOptions, session)
  onCloseHandlers.push(closeBT)
  sessionProtocol.handle('bittorrent', btHandler)
  globalProtocol.handle('bittorrent', btHandler)
  sessionProtocol.handle('bt', btHandler)
  globalProtocol.handle('bt', btHandler)

  const magnetHandler = await createMagnetHandler()
  sessionProtocol.handle('magnet', magnetHandler)
  globalProtocol.handle('magnet', magnetHandler)

  console.log('Registering raw HTTPS handler')

  const { handler: rawHTTPSHandler } = await createRawHTTPSHandler()
  sessionProtocol.handle('https+raw', rawHTTPSHandler)

  console.log('Regisyering web3 handlers')
  const { handler: web3Handler } = await createWeb3Handler(web3Options)
  sessionProtocol.handle('web3', web3Handler)
  globalProtocol.handle('web3', web3Handler)

  const didHandler = await createDIDHandler(didOptions)
  sessionProtocol.handle('did', didHandler)
  globalProtocol.handle('did', didHandler)
}
