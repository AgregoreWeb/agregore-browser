import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler () {
  return fetchToHandler(async () => {
    return async function rawFetch (url, options = {}) {
      const finalURL = url.replace('https+raw:', 'https:')
      const response = await fetch(finalURL, {
        ...options,
        redirect: 'follow',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      })

      return response
    }
  })
}
