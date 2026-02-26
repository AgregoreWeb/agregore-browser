const INFOHASH_MATCH = /^[a-fA-F0-9]{40}$/
const PEERWEB_HOSTS = new Set([
  'peerweb.lol',
  'www.peerweb.lol'
])

/**
 * Rewrite PeerWeb ORC URLs to bittorrent URLs.
 * @param {string} url
 * @returns {string}
 */
export function rewritePeerWebURL (url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  if (!isHTTP(parsed.protocol)) return url
  if (!PEERWEB_HOSTS.has(parsed.hostname.toLowerCase())) return url

  const orc = parsed.searchParams.get('orc')
  if (!orc) return url
  if (!INFOHASH_MATCH.test(orc)) return url

  const infohash = orc.toLowerCase()
  const params = new URLSearchParams(parsed.search)
  params.delete('orc')

  const pathname = isRootPath(parsed.pathname) ? '/index.html' : parsed.pathname
  const query = params.toString()
  const search = query ? `?${query}` : ''
  const hash = parsed.hash || ''

  return `bittorrent://${infohash}${pathname}${search}${hash}`
}

/**
 * @param {string} protocol
 * @returns {boolean}
 */
function isHTTP (protocol) {
  return protocol === 'http:' || protocol === 'https:'
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
function isRootPath (pathname) {
  return !pathname || pathname === '/'
}
