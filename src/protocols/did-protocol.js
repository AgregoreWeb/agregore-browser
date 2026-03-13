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
        // did:web identifiers resolve via HTTPS
        // did:web:example.com -> https://example.com/.well-known/did.json
        const domain = parts.slice(2).join(':').replace(/%3A/g, ':')
        const hostAndPath = domain.replace(/:/g, '/')
        resolveURL = `https://${hostAndPath}/.well-known/did.json`
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
