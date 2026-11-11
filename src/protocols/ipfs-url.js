import { CID } from 'multiformats/cid'
import { base16 } from 'multiformats/bases/base16'
import { base32 } from 'multiformats/bases/base32'
import { base36 } from 'multiformats/bases/base36'
import { base58btc } from 'multiformats/bases/base58'

// Every multibase that shows up in the wild for CID strings in URLs
const CID_BASES = base32.decoder.or(base36.decoder).or(base58btc.decoder).or(base16.decoder)

// What js-ipld-url-resolve can decode (DEFAULT_CID_BASES)
const IPLD_BASES = base32.decoder.or(base36.decoder)

const LOCAL_HOSTNAME = 'localhost'
const READ_ONLY_METHODS = new Set(['GET', 'HEAD'])

/**
 * @param {string} value
 * @returns {CID?}
 */
function parseCID (value) {
  try {
    return CID.parse(value, CID_BASES)
  } catch {
    return null
  }
}

/**
 * Parse a CID from a URL hostname, tolerating uppercase spellings
 * @param {string} hostname
 * @returns {CID?}
 */
function parseHostnameCID (hostname) {
  return parseCID(hostname) || parseCID(hostname.toLowerCase())
}

/**
 * Whether a CID string can be parsed without a multibase decoder
 * (this is all that js-ipfs-fetch / ipfs-unixfs-exporter supports)
 * @param {string} value
 */
function isBareParsableCID (value) {
  return isParsableWithBases(value)
}

/**
 * Whether a CID string parses with the given multibase decoder set
 * @param {string} value
 * @param {import('multiformats/bases/interface').MultibaseDecoder<any>} [bases]
 */
function isParsableWithBases (value, bases) {
  try {
    CID.parse(value, bases)
    return true
  } catch {
    return false
  }
}

/**
 * Gateway path style: `ipfs://<gateway>/ipfs/<cid>/path` or `/ipns/<name>/path`
 * @param {URL} url
 * @returns {boolean} whether the URL was rewritten
 */
function stripGatewayPrefix (url) {
  const segments = url.pathname.split('/').filter(Boolean)
  const [first, second, ...rest] = segments
  if (!second || (first !== 'ipfs' && first !== 'ipns')) return false
  try {
    const trailingSlash = url.pathname.endsWith('/') ? '/' : ''
    url.protocol = `${first}:`
    url.hostname = decodeURIComponent(second)
    url.pathname = `/${rest.join('/')}${trailingSlash}`
    return true
  } catch {
    // Malformed percent-encoding, leave the URL alone
    return false
  }
}

/**
 * Subdomain gateway style: `<cid>.ipfs.<gateway>` or `<name>.ipns.<gateway>`
 * @param {URL} url
 * @returns {boolean} whether the URL was rewritten
 */
function stripGatewaySubdomain (url) {
  const labels = url.hostname.split('.')
  const scheme = labels[1]
  if (labels.length < 3 || (scheme !== 'ipfs' && scheme !== 'ipns')) return false
  url.protocol = `${scheme}:`
  url.hostname = labels[0]
  return true
}

/**
 * Canonicalize the CID in an `ipfs://` URL hostname so that js-ipfs-fetch's
 * bare `CID.parse` can read it. DNSLink domain names and libp2p keys are
 * rerouted to `ipns://` where Kubo can resolve them.
 * @param {URL} url
 * @param {CID?} cid
 * @param {string} method
 * @returns {boolean} whether the URL was rewritten
 */
function canonicalizeCIDHost (url, cid, method) {
  if (cid) {
    if (url.hostname !== url.hostname.toLowerCase() && parseCID(url.hostname.toLowerCase())) {
      url.hostname = url.hostname.toLowerCase()
      return true
    }
    if (!isBareParsableCID(url.hostname)) {
      url.hostname = cid.toV1().toString(base32)
      return true
    }
    return false
  }
  if (!READ_ONLY_METHODS.has(method.toUpperCase())) return false
  url.protocol = 'ipns:'
  return true
}

/**
 * Canonicalize the CID in an `ipld://` URL hostname so that
 * js-ipld-url-resolve's CID.parse (base32/base36 only) can read it
 * @param {URL} url
 * @returns {boolean} whether the URL was rewritten
 */
function canonicalizeIPLDHost (url) {
  const cid = parseHostnameCID(url.hostname)
  if (!cid) return false
  if (isParsableWithBases(url.hostname, IPLD_BASES)) return false
  url.hostname = cid.toV1().toString(base32)
  return true
}

/**
 * Normalize an `ipfs://` or `ipns://` URL into a form that js-ipfs-fetch can
 * route, or `null` when the URL needs no changes. Handles:
 *
 * - CIDs in multibases other than base32/base58btc (e.g. base36 `k…`, hex
 *   `f…`) rewritten to canonical base32, since ipfs-unixfs-exporter calls
 *   `CID.parse` without a multibase decoder and throws
 *   "To parse non base32 or base58btc encoded CID multibase decoder must be
 *   provided" for them.
 * - Gateway-style URLs such as `ipfs://ipfs.io/ipfs/<cid>/path` or
 *   `ipfs://<gateway>/ipns/<name>/path` rewritten to `ipfs://<cid>/path` /
 *   `ipns://<name>/path`.
 * - Subdomain gateway URLs such as `<cid>.ipfs.dweb.link` rewritten to
 *   `ipfs://<cid>/`.
 * - DNSLink domain names (e.g. `ipfs://en.wikipedia-on-ipfs.org`) rewritten
 *   to `ipns://` for read-only requests so Kubo resolves them. Writes to
 *   `ipfs://` URLs are left untouched.
 * - `ipld://` URLs rooted at a CID in any other multibase (e.g. CIDv0 `Qm…`,
 *   hex, uppercase) rewritten to base32, since js-ipld-url-resolve only
 *   decodes base32/base36.
 *
 * @param {string|URL} input
 * @param {string} [method] Request method, used to decide whether rerouting names is safe
 * @returns {URL?} The normalized URL, or null when no change is needed
 */
export function normalizeIPFSURL (input, method = 'GET') {
  const url = new URL(input instanceof URL ? input.href : input)
  if (url.protocol !== 'ipfs:' && url.protocol !== 'ipns:' && url.protocol !== 'ipld:') return null

  let changed = false
  let iterations = 0

  while (iterations++ < 8) {
    let progress = false

    if (url.protocol === 'ipld:') {
      progress = canonicalizeIPLDHost(url)
    } else if (url.hostname !== LOCAL_HOSTNAME) {
      const cid = parseHostnameCID(url.hostname)
      if (!cid) {
        progress = stripGatewayPrefix(url) || stripGatewaySubdomain(url)
      }
      if (!progress && url.protocol === 'ipfs:') {
        progress = canonicalizeCIDHost(url, cid, method)
      }
    }

    if (!progress) break
    changed = true
  }

  return changed ? url : null
}
