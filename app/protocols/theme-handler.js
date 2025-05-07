import path from 'path'
import { fileURLToPath } from 'url'
import mime from 'mime-types'
import ScopedFS from 'scoped-fs'

const __dirname = fileURLToPath(new URL('./', import.meta.url))
const themePath = path.join(__dirname, '../pages/theme')
const fs = new ScopedFS(themePath)

const CHECK_PATHS = [
  (path) => path,
  (path) => path + 'index.html',
  (path) => path + 'index.md',
  (path) => path + '/index.html',
  (path) => path + '/index.md',
  (path) => path + '.html',
  (path) => path + '.md'
]

async function resolveFile (filePath) {
  for (const toTry of CHECK_PATHS) {
    const tryPath = toTry(filePath)
    if (await exists(tryPath)) return tryPath
  }
  throw new Error('File not found')
}

async function exists (filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') resolve(false)
        else reject(err)
      } else resolve(stat.isFile())
    })
  })
}

export async function createThemeHandler () {
  return {
    handler: async function protocolHandler ({ url }, sendResponse) {
      const parsedUrl = new URL(url)

      if (parsedUrl.hostname === 'theme') {
        const fileName = parsedUrl.pathname.slice(1)
        console.log('Attempting to serve:', fileName)

        try {
          const resolvedPath = await resolveFile(fileName)
          const statusCode = 200
          const data = fs.createReadStream(resolvedPath)
          const contentType = mime.lookup(resolvedPath) || 'text/plain'
          const headers = {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Allow-CSP-From': '*',
            'Cache-Control': 'no-cache'
          }

          sendResponse({
            statusCode,
            headers,
            data
          })
        } catch (e) {
          console.log('File not found:', fileName)
          sendResponse({
            statusCode: 404,
            headers: {
              'Content-Type': 'text/html',
              'Access-Control-Allow-Origin': '*',
              'Allow-CSP-From': '*',
              'Cache-Control': 'no-cache'
            },
            data: fs.createReadStream('../404.html')
          })
        }
      } else {
        sendResponse({
          statusCode: 404,
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Allow-CSP-From': '*',
            'Cache-Control': 'no-cache'
          },
          data: fs.createReadStream('../404.html')
        })
      }
    }
  }
}
