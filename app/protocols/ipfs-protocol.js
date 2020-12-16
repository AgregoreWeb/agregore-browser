const IPFS = require('ipfs')
const makeFetch = require('js-ipfs-fetch')
const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options) {
  return fetchToHandler(async () => {
    const ipfs = await IPFS.create(options)
    const fetch = makeFetch({ ipfs })

    return fetch
  })
}
