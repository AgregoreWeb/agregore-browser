const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const hyperFetch = require('hypercore-fetch')
    const SDK = require('hyper-sdk')

    const sdk = await SDK(options)
    const { Hyperdrive } = sdk
    const fetch = hyperFetch({
      Hyperdrive,
      writable: true
    })

    return fetch
  }, session)
}
