/* global globalThis */
import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler (options, session) {
  return fetchToHandler(async () => {
    // This enables webtorrent-hybrid functionality
    // https://github.com/webtorrent/webtorrent-hybrid/blob/v4.1.3/lib/global.js
    const { default: createTorrent } = await import('create-torrent')
    const { default: wrtc } = await import('@roamhq/wrtc')
    globalThis.WEBTORRENT_ANNOUNCE = createTorrent.announceList
      .map(arr => arr[0])
      .filter(url => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0)
    globalThis.WRTC = wrtc

    const { default: makeFetch } = await import('bt-fetch')

    const fetch = makeFetch(options)
    const compatFetch = async (request) => {
      if (!request || typeof request !== 'object') {
        return fetch(request)
      }

      if (typeof request.url !== 'string') {
        return fetch(request)
      }

      return fetch({
        url: request.url,
        method: request.method || 'GET',
        headers: normalizeHeaders(request.headers),
        body: request.body,
        referrer: request.referrer,
        signal: request.signal
      })
    }

    return compatFetch
  }, session)
}

/**
 * @param {Headers|Record<string, string>|undefined} headers
 * @returns {Record<string, string>}
 */
function normalizeHeaders (headers) {
  if (!headers) return {}

  if (typeof headers.entries === 'function') {
    const finalHeaders = {}
    for (const [key, value] of headers.entries()) {
      finalHeaders[key] = value
    }
    return finalHeaders
  }

  return { ...headers }
}
