const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const IPFS = require('ipfs-core')
    const makeFetch = require('js-ipfs-fetch')

    const ipfs = await IPFS.create(options)

    const fetch = makeFetch({ ipfs })

    return fetch
  }, session)
}
