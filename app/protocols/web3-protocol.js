/* globals Response */
import { Client } from 'web3protocol'
import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler (options) {
  return fetchToHandler(async () => {
    const { chainList, ...opts } = options
    const web3Client = new Client(chainList, opts)
    async function fetch ({url, method }) {
      if (method !== 'GET') {
        return new Response('Method Not Allowed', {
          status: 405
        })
      }
      const { httpCode, httpHeaders, output } = await web3Client.fetchUrl(url)

      return new Response(output, { status: httpCode, headers: httpHeaders })
    }

    return fetch
  })
}
