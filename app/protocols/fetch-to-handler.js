import fs from 'fs-extra'
import { Readable } from 'stream'

/*
export const CORS_HEADERS = [
 'Access-Control-Allow-Origin',
 'Allow-CSP-From',
 'Access-Control-Allow-Headers',
 'Access-Control-Allow-Methods',
 'Access-Control-Request-Headers'
]
*/

export default function fetchToHandler (getFetch, session) {
  let hasFetch = null
  let loadingFetch = null

  async function load () {
    try {
      if (hasFetch) return hasFetch
      if (loadingFetch) return loadingFetch

      loadingFetch = Promise.resolve(getFetch()).then((fetch) => {
        hasFetch = fetch
        return fetch
      })

      return loadingFetch
    } finally {
      loadingFetch = null
    }
  }

  async function * readBody (body) {
    for (const chunk of body) {
      if (chunk.bytes) {
        yield await Promise.resolve(chunk.bytes)
      } else if (chunk.blobUUID) {
        yield await session.getBlobData(chunk.blobUUID)
      } else if (chunk.file) {
        yield * Readable.from(fs.createReadStream(chunk.file))
      }
    }
  }

  const close = async () => {
    if (loadingFetch) {
      await loadingFetch
      await close()
    } else if (hasFetch) {
      if (hasFetch.close) await hasFetch.close()
      else if (hasFetch.destroy) await hasFetch.destroy()
    }
  }

  return { handler: protocolHandler, close }

  async function protocolHandler (req, sendResponse) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Allow-CSP-From': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Request-Headers': '*'
    }

    try {
      // Lazy load fetch implementation
      const fetch = await load()

      const { url, headers: requestHeaders, method, uploadData } = req

      const body = uploadData ? Readable.from(readBody(uploadData)) : null

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        session,
        duplex: 'half'
      })

      const { status: statusCode, body: responseBody, headers: responseHeaders } = response

      for (const [key, value] of responseHeaders) {
        if (Array.isArray(value)) {
          headers[key] = value[0]
        } else {
          headers[key] = value
        }
      }

      const isAsync = responseBody && responseBody[Symbol.asyncIterator]
      const data = isAsync ? Readable.from(responseBody, { objectMode: false }) : responseBody

      sendResponse({
        statusCode,
        headers,
        data
      })
    } catch (e) {
      console.log(e)
      sendResponse({
        statusCode: 500,
        headers,
        data: intoStream(e.stack)
      })
    }
  }
}

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}
