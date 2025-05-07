import path from 'path'
import { fileURLToPath } from 'url'
import mime from 'mime-types'
import { Readable } from 'stream'
import ScopedFS from 'scoped-fs'
import Config from '../config.js'

const __dirname = fileURLToPath(new URL('./', import.meta.url))
const themePath = path.join(__dirname, '../pages/theme')
const pagesPath = path.join(__dirname, '../pages')
const themeFS = new ScopedFS(themePath)
const pagesFS = new ScopedFS(pagesPath)
const { theme } = Config

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
    themeFS.stat(filePath, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') resolve(false)
        else reject(err)
      } else resolve(stat.isFile())
    })
  })
}

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}

export async function createThemeHandler () {
  return {
    handler: async function protocolHandler ({ url }, sendResponse) {
      const parsedUrl = new URL(url)

      if (parsedUrl.hostname === 'theme') {
        const fileName = parsedUrl.pathname.slice(1)
        console.log('Attempting to serve:', fileName)

        if (fileName === 'vars.css') {
          const statusCode = 200
          const themes = Object
            .keys(theme)
            .map((name) => `  --ag-theme-${name}: ${theme[name]};`)
            .join('\n')

          const data = intoStream(`
:root {
  --ag-color-purple: #6e2de5;
  --ag-color-black: #111111;
  --ag-color-white: #F2F2F2;
  --ag-color-green: #2de56e;
  /* TODO(@RangerMauve): Add Base16 variables (--base00 to --base0F) for cross-browser compatibility */
}

:root {
${themes}
}
          `)

          const headers = {
            'Content-Type': 'text/css',
            'Access-Control-Allow-Origin': '*',
            'Allow-CSP-From': '*',
            'Cache-Control': 'no-cache'
          }

          sendResponse({
            statusCode,
            headers,
            data
          })
          return
        }

        try {
          const resolvedPath = await resolveFile(fileName)
          const statusCode = 200
          const data = themeFS.createReadStream(resolvedPath)
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
            data: pagesFS.createReadStream('404.html')
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
          data: pagesFS.createReadStream('404.html')
        })
      }
    }
  }
}
