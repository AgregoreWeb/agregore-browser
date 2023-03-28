import fetchToHandler from './fetch-to-handler.js'
import path from 'node:path'
import * as fs from 'node:fs/promises'

export default async function createHandler (ipfsOptions, session) {
  return fetchToHandler(async () => {
    const { default: makeFetch } = await import('js-ipfs-fetch')
    const ipfsHttpModule = await import('ipfs-http-client')

    const Ctl = await import('ipfsd-ctl')

    const { default: GoIPFS } = await import('go-ipfs')

    const ipfsBin = GoIPFS
      .path()
      .replace(`.asar${path.sep}`, `.asar.unpacked${path.sep}`)

    const ipfsdOpts = {

      ipfsOptions,
      type: 'go',
      disposable: false,
      test: false,
      remote: false,
      ipfsHttpModule,
      ipfsBin
    }

    let ipfsd = await Ctl.createController(ipfsdOpts)

    await ipfsd.init({ ipfsOptions })
    const version = await ipfsd.version()
    console.log(`IPFS Version: ${version}\nIPFS bin path: ${ipfsBin}`)

    try {
      await ipfsd.start()
      await ipfsd.api.id()
    } catch (e) {
      console.log('IPFS Unable to boot daemon', e.message)
      const { repo } = ipfsOptions
      const lockFile = path.join(repo, 'repo.lock')
      const apiFile = path.join(repo, 'api')
      try {
        await Promise.all([
          fs.rm(lockFile),
          fs.rm(apiFile)
        ])
        ipfsd = await Ctl.createController(ipfsdOpts)
        await ipfsd.start()
        await ipfsd.api.id()
      } catch (cause) {
        const message = `Unable to start daemon due to extra lockfile. Please clear your ipfs folder at ${repo} and try again.`
        throw new Error(message, { cause })
      }
    }

    console.log('IPFS ID:', await ipfsd.api.id())

    const fetch = await makeFetch({
      ipfs: ipfsd.api
    })

    fetch.close = async () => {
      return ipfsd.stop()
    }

    return fetch
  }, session)
}
