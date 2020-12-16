const { Readable } = require('stream')

module.exports = function fetchToHandler (getFetch) {
  let hasFetch = null
  let loadingFetch = null

  async function load () {
    if (hasFetch) return hasFetch
    if (loadingFetch) return loadingFetch

    loadingFetch = Promise.resolve(getFetch()).then((fetch) => {
      hasFetch = fetch
      loadingFetch = null
      return fetch
    })

    return loadingFetch
  }

  return async function protocolHandler (req, sendResponse) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Allow-CSP-From': '*'
    }

    try {
      // Lazy load fetch implementation
      const fetch = await load()

      const { url, headers: requestHeaders, method, uploadData } = req

      const body = uploadData ? (
        uploadData.length > 1 ? uploadData : uploadData[0]
      ) : null

      const response = await fetch(url, { headers: requestHeaders, method, body })

      const { status: statusCode, body: responseBody, headers: responseHeaders } = response

      for (const [key, value] of responseHeaders) {
        headers[key] = value
      }

      const isAsync = responseBody[Symbol.asyncIterator]

      const data = isAsync ? Readable.from(responseBody) : responseBody

      sendResponse({
        statusCode,
        headers,
        data
      })
    } catch (e) {
      console.log(e)
      sendResponse({
        statusCode: 500,
        headers,
        data: intoStream(e.stack)
      })
    }
  }
}

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}
