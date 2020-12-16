const hyperdrivePromise = require('@geut/hyperdrive-promise')
const datFetch = require('dat-fetch')
const SDK = require('dat-sdk-old')
const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler () {
  return fetchToHandler(async () => {
    const sdk = SDK()
    const Hyperdrive = (key) => hyperdrivePromise(sdk.Hyperdrive(key))
    function resolveName (name) {
      return new Promise((resolve, reject) => {
        sdk.resolveName(name, (err, url) => {
          if (err) reject(err)
          else resolve(url)
        })
      })
    }
    const fetch = datFetch({
      Hyperdrive,
      resolveName,
      // Even though we could make it mutable, lets keep the legacy code immutable
      writable: false
    })

    return fetch
  })
}
