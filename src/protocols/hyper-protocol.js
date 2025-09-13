import fetchToHandler from './fetch-to-handler.js'

export default async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const { default: hyperFetch } = await import('hypercore-fetch')
    const SDK = await import('hyper-sdk')

    const sdk = await SDK.create(options)
    const fetch = await hyperFetch({
      sdk,
      writable: true
    })

    console.log({ sdk, fetch })

    fetch.close = () => sdk.close()

    return fetch
  }, session)
}
