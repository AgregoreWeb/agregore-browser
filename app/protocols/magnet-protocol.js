const { Readable } = require('stream')

const INFO_HASH_MATCH = /^urn:btih:([a-f0-9]{40})$/ig

module.exports = async function createHandler () {
  return function magnetHandler (req, sendResponse) {
    try {
      const parsed = new URL(req.url)

      const xt = parsed.searchParams.get('xt')
      if (!xt) {
        sendError('Magnet link has no `xt` parameter')
      } else {
        const match = INFO_HASH_MATCH.exec(xt)
        if (!match) {
          sendError('Magnet has no bittorrent infohash')
        } else {
          const infohash = match[1]
          const final = `bittorrent://${infohash}/`
          sendResponse({
            statusCode: 308,
            headers: {
              Location: final
            },
            data: intoStream('')
          })
        }
      }
    } catch (e) {
      sendError(e.stack)
    }

    function sendError (message) {
      sendResponse({
        statusCode: 400,
        headers: {
          'content-type': 'text/html'
        },
        data: intoStream(message)
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
