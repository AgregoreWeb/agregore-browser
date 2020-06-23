const path = require('path')
const fs = require('fs-extra')

const WELCOME_LOCATION = path.join(__dirname, '../ui/welcome.html')

module.exports = async function createHandler () {
  return async function protocolHandler ({ url }, sendResponse) {
    console.debug('Rendering browser page', url)
    const statusCode = 200

    const data = fs.createReadStream(WELCOME_LOCATION)

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Allow-CSP-From': '*',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/html'
    }

    sendResponse({
      statusCode,
      headers,
      data
    })
  }
}
