import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler () {
  return fetchToHandler(async () => {
    return async function rawFetch ({ url, headers, ...options } = {}) {
      const finalURL = url.replace('https+raw:', 'https:')
      const response = await fetch(finalURL, {
        headers,
        redirect: 'follow',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      })

      return response
    }
  })
}
