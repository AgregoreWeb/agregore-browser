import fetchToHandler from './fetch-to-handler.js'
import path from 'node:path'
import * as fs from 'node:fs/promises'
/** @import { LocalSiteTracker } from '../localsites.js' */

/**
 *
 * @param {object} ipfsOptions
 * @param {import('electron').Session} session
 * @param {import('../localsites.js').LocalSiteTracker} tracker
 * @returns
 */
export default async function createHandler (ipfsOptions, session, tracker) {
  return fetchToHandler(async () => {
    const { default: makeFetch } = await import('js-ipfs-fetch')
    const { createNode } = await import('ipfsd-ctl')
    const { create: createRPC } = await import('kubo-rpc-client')
    const { default: kubo } = await import('kubo')

    const bin = kubo.path()
      .replace(`.asar${path.sep}`, `.asar.unpacked${path.sep}`)

    const { repo, config } = ipfsOptions

    const nodeOptions = {
      type: 'kubo',
      rpc: createRPC,
      bin,
      repo,
      disposable: false,
      init: {
        config
      }
    }

    let node = await createNode(nodeOptions)

    try {
      await node.init()
      await node.start()
      await node.api.id()
    } catch (e) {
      console.log('IPFS Unable to boot daemon', e.message)
      const lockFile = path.join(repo, 'repo.lock')
      const apiFile = path.join(repo, 'api')
      try {
        await Promise.all([
          fs.rm(lockFile),
          fs.rm(apiFile)
        ])
        node = await createNode(nodeOptions)
        await node.init()
        await node.start()
        await node.api.id()
      } catch (cause) {
        const message = `Unable to start daemon due to extra lockfile. Please clear your ipfs folder at ${repo} and try again.`
        throw new Error(message, { cause })
      }
    }

    const { version } = await node.api.version()
    console.log(`IPFS Version: ${version}\nIPFS bin path: ${bin}`)
    console.log('IPFS ID:', await node.api.id())

    const fetch = await makeFetch({
      ipfs: node.api,
      /**
       *
       * @param {URL} url
       * @param {boolean} writable
       * @param {string} [name]
       */
      onLoad (url, writable, name) {
        tracker.onLoad(url, writable, name)
      },
      /**
       * @param {URL} url
       */
      onDelete (url) {
        tracker.onDelete(url)
      }
    })

    fetch.close = async () => {
      return node.stop()
    }

    return fetch
  }, session)
}
