const fetch = require('gemini-fetch')()
const { Readable } = require('stream')
const MIMEType = require('whatwg-mimetype')

module.exports = async function createHandler () {
  return async function protocolHandler (req, sendResponse) {
    const { url, headers: requestHeaders, method, uploadData } = req

    console.log(req)

    const body = uploadData ? (
      uploadData.length > 1 ? uploadData : uploadData[0]
    ) : null

    const response = await fetch(url, { headers: requestHeaders, method, body })

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

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}
