const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (ipfsOptions, session) {
  return fetchToHandler(async () => {
    const makeFetch = require('js-ipfs-fetch')
    const ipfsHttpModule = require('ipfs-http-client')

    const Ctl = require('ipfsd-ctl')

    const ipfsBin = require('go-ipfs')
      .path()
      .replace('app.asar', 'app.asar.unpacked')

    const ipfsd = await Ctl.createController({
      ipfsOptions,
      disposable: false,
      test: false,
      remote: false,
      args: '--enable-pubsub-experiment',
      ipfsHttpModule,
      ipfsBin
    })

    await ipfsd.init()

    await ipfsd.start()

    const ipfs = ipfsd.api

    console.log('IPFS:', await ipfs.id())

    const fetch = await makeFetch({ ipfs })

    fetch.close = async () => {
      return ipfsd.stop()
    }

    return fetch
  }, session)
}
