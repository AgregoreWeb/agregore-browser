const path = require('path')
const mime = require('mime/lite')
const ScopedFS = require('scoped-fs')
const fs = new ScopedFS(path.join(__dirname, '../pages'))

const CHECK_PATHS = [
  (path) => path,
  (path) => path + 'index.html',
  (path) => path + 'index.md',
  (path) => path + '/index.html',
  (path) => path + '/index.md',
  (path) => path + '.html',
  (path) => path + '.md'
]

module.exports = async function createHandler () {
  return async function protocolHandler (req, sendResponse) {
    const { url } = req

    const parsed = new URL(url)
    const { pathname, hostname } = parsed
    const toResolve = path.join(hostname, pathname)
    try {
      const resolvedPath = await resolveFile(toResolve)
      const statusCode = 200

      const contentType = mime.getType(resolvedPath) || 'text/plain'

      const data = fs.createReadStream(resolvedPath)

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': 'agregore://welcome',
        'Cache-Control': 'no-cache',
        'Content-Type': contentType
      }

      sendResponse({
        statusCode,
        headers,
        data
      })
    } catch (e) {
      const statusCode = 404

      const data = fs.createReadStream('404.html')

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/html'
      }

      sendResponse({
        statusCode,
        headers,
        data
      })
    }
  }
}

async function resolveFile (path) {
  for (const toTry of CHECK_PATHS) {
    const tryPath = toTry(path)
    if (await exists(tryPath)) return tryPath
  }
  throw new Error('Not Found')
}

function exists (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') resolve(false)
        else reject(err)
      } else resolve(stat.isFile())
    })
  })
}
