import fetchToHandler from './fetch-to-handler.js'

/**
 *
 * @param {object} options
 * @param {import('electron').Session} session
 * @returns
 */
export default async function createHandler (options = {}, session) {
  return fetchToHandler(async () => {
    const { default: makeHyperHttpFetch } = await import('hyper-http-fetch')

    const fetch = await makeHyperHttpFetch({})

    return fetch
  }, session)
}
