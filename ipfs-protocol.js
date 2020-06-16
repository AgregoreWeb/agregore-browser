const IPFS = require('ipfs')
const { Readable } = require('stream')

module.exports = async function createHandler () {
  const node = await IPFS.create()

  return async function protocolHandler ({ url }, sendResponse) {
    let data = null
    let statusCode = 200
    try {
      data = Readable.from(node.cat(url))
    } catch (e) {
      statusCode = 500
      data = Readable.from([Buffer.from(e.stack)])
    }

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Allow-CSP-From': '*',
      'Cache-Control': 'no-cache'
    }

    sendResponse({
      statusCode,
      headers,
      data
    })
  }
}
