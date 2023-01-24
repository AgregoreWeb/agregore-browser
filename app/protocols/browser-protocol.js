import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import mime from 'mime'
import ScopedFS from 'scoped-fs'

import { version, dependencies as packageDependencies } from '../version.js'
import Config from '../config.js'
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

const pagesURL = new URL('../pages', import.meta.url)
const pagesPath = fileURLToPath(pagesURL)

const fs = new ScopedFS(pagesPath)

export default async function createHandler () {
  return { handler: protocolHandler, close }

  function close () {}

  async function protocolHandler (req, sendResponse) {
    const { url } = req

    const parsed = new URL(url)
    const { pathname, hostname } = parsed
    const toResolve = path.join(hostname, pathname)

    if (hostname === 'about') {
      const statusCode = 200

      const packagesToRender = [
        'hypercore-fetch',
        'hyper-sdk',
        'js-ipfs-fetch',
        'ipfs-core',
        'bt-fetch',
        'gun-fetch',
        'gemini-fetch'
      ]

      const dependencies = {}
      for (const name of packagesToRender) {
        dependencies[name] = packageDependencies[name]
      }

      const aboutInfo = {
        version,
        dependencies
      }

      const data = intoStream(JSON.stringify(aboutInfo, null, '\t'))

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Content-Type': 'application/json'
      }

      sendResponse({
        statusCode,
        headers,
        data
      })

      return
    } else if ((hostname === 'theme') && (pathname === '/vars.css')) {
      const statusCode = 200

      const themes = Object
        .keys(theme)
        .map((name) => `  --ag-theme-${name}: ${theme[name]};`)
        .join('\n')

      const data = intoStream(`
:root {
  --ag-color-purple: #6e2de5;
  --ag-color-black: #111;
  --ag-color-white: #F2F2F2;
  --ag-color-green: #2de56e;
}

:root {
${themes}
}
      `)

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/css'
      }

      sendResponse({
        statusCode,
        headers,
        data
      })

      return
    }

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

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}
