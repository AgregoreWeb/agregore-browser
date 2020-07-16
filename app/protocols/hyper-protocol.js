const datFetch = require('dat-fetch')
const SDK = require('dat-sdk')

module.exports = async function createHandler () {
  const sdk = await SDK()
  const fetch = datFetch(sdk)
  return async function protocolHandler (req, sendResponse) {
    const { url, headers: requestHeaders, method } = req

    console.log(req)

    const response = await fetch(url, { headers: requestHeaders, method })

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

    process.nextTick(() => {
      data.resume()
    })
  }
}
