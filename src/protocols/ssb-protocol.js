import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const { default: makeSsbFetch } = await import('ssb-fetch')

    const fetch = makeSsbFetch(options)

    return fetch
  }, session)
}
