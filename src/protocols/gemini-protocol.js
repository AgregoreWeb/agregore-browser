import makeFetch from 'gemini-fetch'
import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler () {
  return fetchToHandler(async () => {
    const fetch = makeFetch()

    return fetch
  })
}
