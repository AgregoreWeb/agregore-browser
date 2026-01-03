import fetchToHandler from './fetch-to-handler.js'
/** @import { LocalSiteTracker } from '../localsites.js' */

/**
 *
 * @param {object} options
 * @param {import('electron').Session} session
 * @param {LocalSiteTracker} tracker
 * @returns
 */
export default async function createHandler (options, session, tracker) {
  return fetchToHandler(async () => {
    const { default: hyperFetch } = await import('hypercore-fetch')
    const SDK = await import('hyper-sdk')

    const sdk = await SDK.create(options)
    const fetch = await hyperFetch({
      sdk,
      writable: true,
      onLoad (url, writable, name) {
        tracker.onLoad(url, writable, name)
      },
      onDelete (url) {
        tracker.onDelete(url)
      }
    })

    console.log({ sdk, fetch })

    // @ts-ignore TODO: better way to return close handlers
    fetch.close = () => sdk.close()

    return fetch
  }, session)
}
