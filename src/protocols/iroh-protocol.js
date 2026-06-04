import fetchToHandler from './fetch-to-handler.js'
import path from 'node:path'

const ALPN = Object.freeze(new TextEncoder().encode('iroh-http/0.1'))
const MAX_RESPONSE_SIZE = 64 * 1024 * 1024

export default async function createHandler (irohOptions, session) {
  return fetchToHandler(async () => {
    const { Iroh } = await import('@number0/iroh')

    const storage = irohOptions.storage
      ? path.join(irohOptions.storage, 'iroh')
      : undefined

    const node = storage
      ? await Iroh.persistent(storage)
      : await Iroh.memory()

    const endpoint = node.node.endpoint()

    async function irohFetch (request) {
      const url = new URL(request.url)
      const nodeId = url.hostname
      if (!nodeId) {
        return new Response('Missing node ID in iroh:// URL', { status: 400 })
      }

      const pathname = url.pathname + url.search
      const method = request.method || 'GET'

      let conn
      try {
        conn = await endpoint.connect({ nodeId }, ALPN)
      } catch {
        return new Response(`Could not connect to iroh node: ${nodeId}`, { status: 502 })
      }

      const bi = await conn.openBi()

      const requestHead = `${method} ${pathname} HTTP/1.1\r\n`
      await bi.send.writeAll(new TextEncoder().encode(requestHead))

      if (request.body) {
        const reader = request.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await bi.send.writeAll(value)
        }
      }

      await bi.send.finish()

      const responseBytes = await bi.recv.readToEnd(MAX_RESPONSE_SIZE)

      return new Response(responseBytes, {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' }
      })
    }

    irohFetch.close = () => node.node.shutdown()

    return irohFetch
  }, session)
}
