/* global globalThis */
import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler (options, session) {
  return fetchToHandler(async () => {
    // This enables webtorrent-hybrid functionality
    // https://github.com/webtorrent/webtorrent-hybrid/blob/v4.1.3/lib/global.js
    const { default: createTorrent } = await import('create-torrent')
    const { default: wrtc } = await import('wrtc')
    globalThis.WEBTORRENT_ANNOUNCE = createTorrent.announceList
      .map(arr => arr[0])
      .filter(url => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0)
    globalThis.WRTC = wrtc

    const { default: makeFetch } = await import('bt-fetch')

    const fetch = makeFetch(options)

    return fetch
  }, session)
}
