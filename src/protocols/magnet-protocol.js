/* global Response */
// Matchers must stay stateless: without the global flag, exec() always
// starts from index 0. With /g, repeated requests share lastIndex and every
// other magnet link fails to match.
const INFO_HASH_MATCH = /^urn:btih:([a-f0-9]{40})$/i
const INFO_HASH_BASE32_MATCH = /^urn:btih:([a-z2-7]{32})$/i
const PUBLIC_KEY_MATCH = /^urn:btpk:([a-f0-9]{64})$/i

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

export default async function createHandler () {
  return function magnetHandler (req) {
    try {
      const parsed = new URL(req.url)

      const xt = parsed.searchParams.get('xt')
      const xs = parsed.searchParams.get('xs')

      if (xs) {
        const match = PUBLIC_KEY_MATCH.exec(xs)
        if (match) {
          const publicKey = match[1].toLowerCase()
          const final = `bittorrent://${publicKey}/`
          return sendFinal(final)
        }
      }
      if (xt) {
        const v1Match = INFO_HASH_MATCH.exec(xt)
        const base32Match = v1Match ? null : INFO_HASH_BASE32_MATCH.exec(xt)
        if (!v1Match && !base32Match) {
          return sendError('Magnet has no bittorrent infohash')
        }
        const infohash = v1Match ? v1Match[1].toLowerCase() : base32ToHex(base32Match[1])
        const final = `bittorrent://${infohash}/`
        return sendFinal(final)
      }

      return sendError('Magnet link has no `xt` or `xs` parameter')
    } catch (e) {
      return sendError(e.stack)
    }

    function sendFinal (Location) {
      return new Response('', {
        status: 308,
        headers: {
          Location
        }
      })
    }

    function sendError (message) {
      return new Response(message, {
        status: 400,
        headers: {
          'content-type': 'text/html'
        }
      })
    }
  }
}

/**
 * Decode a base32 (RFC 4648, no padding) v1 infohash into hex
 * @param {string} encoded
 * @returns {string}
 */
function base32ToHex (encoded) {
  let bits = ''
  for (const char of encoded.toLowerCase()) {
    const value = BASE32_ALPHABET.indexOf(char)
    if (value === -1) throw new Error(`Invalid base32 character: ${char}`)
    bits += value.toString(2).padStart(5, '0')
  }
  let hex = ''
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    hex += parseInt(bits.slice(i, i + 8), 2).toString(16).padStart(2, '0')
  }
  return hex
}
