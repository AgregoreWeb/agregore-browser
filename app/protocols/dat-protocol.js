const hyperdrivePromise = require('@geut/hyperdrive-promise')
const datFetch = require('dat-fetch')
const SDK = require('dat-sdk-old')

module.exports = async function createHandler () {
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
  return async function protocolHandler ({ url }, sendResponse) {
    const response = await fetch(url)

    const { status: statusCode, body: data, headers: responseHeaders } = response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Allow-CSP-From': '*',
      'Cache-Control': 'no-cache'
    }

    for (const [key, value] of responseHeaders) {
      headers[key] = value
    }

    sendResponse({
      statusCode,
      headers,
      data
    })
  }
}
