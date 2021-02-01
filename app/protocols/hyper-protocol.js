const datFetch = require('hypercore-fetch')
const SDK = require('dat-sdk')
const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const sdk = await SDK()
    const { Hyperdrive, resolveName } = sdk
    const fetch = datFetch({ Hyperdrive, resolveName, writable: true })

    return fetch
  }, session)
}
