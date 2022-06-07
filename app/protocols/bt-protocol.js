/* global globalThis */
const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    // This enables webtorrent-hybrid functionality
    // https://github.com/webtorrent/webtorrent-hybrid/blob/v4.1.3/lib/global.js
    const createTorrent = require('create-torrent')
    const wrtc = require('wrtc')
    globalThis.WEBTORRENT_ANNOUNCE = createTorrent.announceList
      .map(arr => arr[0])
      .filter(url => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0)
    globalThis.WRTC = wrtc

    const makeFetch = require('bt-fetch')

    const fetch = makeFetch(options)

    return fetch
  }, session)
}
