import { Readable } from 'stream'

const INFO_HASH_MATCH = /^urn:btih:([a-f0-9]{40})$/ig
const PUBLIC_KEY_MATCH = /^urn:btpk:([a-f0-9]{64})$/ig

export default async function createHandler () {
  return function magnetHandler (req, sendResponse) {
    try {
      const parsed = new URL(req.url)

      const xt = parsed.searchParams.get('xt')
      const xs = parsed.searchParams.get('xs')

      if (xs) {
        const match = PUBLIC_KEY_MATCH.exec(xs)
        if (!match) {
          return sendError('Magnet has no bittorrent infohash')
        }
        const publicKey = match[1]
        const final = `bittorrent://${publicKey}`
        sendFinal(final)
      } else if (xt) {
        const match = INFO_HASH_MATCH.exec(xt)
        if (!match) {
          return sendError('Magnet has no bittorrent infohash')
        }
        const infohash = match[1]
        const final = `bittorrent://${infohash}/`
        sendFinal(final)
      } else {
        return sendError('Magnet link has no `xt` or `xs` parameter')
      }
    } catch (e) {
      sendError(e.stack)
    }

    function sendFinal (Location) {
      sendResponse({
        statusCode: 308,
        headers: {
          Location
        },
        data: intoStream('')
      })
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
