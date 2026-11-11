/* global Response */

const DEFAULT_PLC_DIRECTORY = 'https://plc.directory'

/**
 * Create a handler for did: protocol URLs
 * Resolves AT Protocol DIDs (did:plc and did:web) to their DID Documents
 * @param {object} options
 * @param {string} [options.plcDirectory] - URL of the PLC directory service
 */
export default async function createHandler (options = {}) {
  const plcDirectory = options.plcDirectory || DEFAULT_PLC_DIRECTORY

  return function didHandler (/** @type {{ url: string }} */ req) {
    return resolve(req.url)
  }

  /** @param {string} url */
  async function resolve (url) {
    try {
      // did: URLs look like did:plc:abc123 or did:web:example.com
      // Electron may give us did:// format, normalize it
      const did = url.startsWith('did://') ? url.replace('did://', 'did:') : url

      const parts = did.split(':')
      if (parts.length < 3 || parts[0] !== 'did') {
        return sendError(400, `Invalid DID format: ${did}`)
      }

      const method = parts[1]

      /** @type {string} */
      let resolveURL

      if (method === 'plc') {
        // did:plc identifiers resolve via plc.directory
        resolveURL = `${plcDirectory}/${did}`
      } else if (method === 'web') {
        // did:web identifiers resolve via HTTPS (W3C did:web spec):
        // did:web:example.com -> https://example.com/.well-known/did.json
        // did:web:example.com:8080 -> https://example.com:8080/.well-known/did.json
        // did:web:example.com:u:p -> https://example.com/u/p/.well-known/did.json
        const segments = parts.slice(2).map((segment) => decodeURIComponent(segment))
        if (!segments[0]) {
          return sendError(400, `Invalid DID format: ${did}`)
        }
        const host = segments[0]
        let port = ''
        let pathSegments = segments.slice(1)
        // A numeric segment right after the domain is a port, not a path
        if (/^[0-9]+$/.test(pathSegments[0] || '')) {
          port = `:${pathSegments[0]}`
          pathSegments = pathSegments.slice(1)
        }
        const path = pathSegments.length ? `/${pathSegments.join('/')}` : ''
        resolveURL = `https://${host}${port}${path}/.well-known/did.json`
      } else {
        return sendError(400, `Unsupported DID method: ${method}. Supported methods: plc, web`)
      }

      const response = await fetch(resolveURL)

      if (!response.ok) {
        return sendError(
          response.status,
          `Failed to resolve DID: ${did}\nHTTP ${response.status} from ${resolveURL}`
        )
      }

      const json = await response.json()

      return new Response(JSON.stringify(json), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Allow-CSP-From': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*'
        }
      })
    } catch (/** @type {any} */ e) {
      return sendError(500, `Error resolving DID: ${e.message}\n${e.stack}`)
    }
  }

  /** @param {number} status @param {string} message */
  function sendError (status, message) {
    return new Response(message, {
      status,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  }
}
