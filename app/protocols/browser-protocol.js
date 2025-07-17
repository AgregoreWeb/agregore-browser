/* global Response, ReadableStream */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mime from 'mime'
import ScopedFS from 'scoped-fs'

import { version, dependencies as packageDependencies } from '../version.js'
import Config from '../config.js'

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

  async function protocolHandler (req) {
    const { url } = req

    const parsed = new URL(url)
    const { pathname, hostname } = parsed
    const toResolve = path.join(hostname, pathname)

    if (hostname === 'about') {
      const status = 200

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

      const body = JSON.stringify(aboutInfo, null, '\t')

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Content-Type': 'application/json'
      }

      return new Response(body, {
        status,
        headers
      })
    } else if ((hostname === 'theme') && (pathname === '/vars.css')) {
      const status = 200

      const themes = Object
        .keys(Config.theme)
        .map((name) => `  --ag-theme-${name}: ${Config.theme[name]};`)
        .join('\n')

      const body = `
:root {
  --ag-color-purple: #6e2de5;
  --ag-color-black: #111111;
  --ag-color-white: #F2F2F2;
  --ag-color-green: #2de56e;
}

:root {
${themes}

  --browser-theme-font-family: var(--ag-theme-font-family);
  --browser-theme-background: var(--ag-theme-background);
  --browser-theme-text-color: var(--ag-theme-text);
  --browser-theme-primary-highlight: var(--ag-theme-primary);
  --browser-theme-secondary-highlight: var(--ag-theme-secondary);
}
      `

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/css'
      }

      return new Response(body, {
        status,
        headers
      })
    } else if ((hostname === 'theme') && (pathname === '/base.css')) {
      const status = 200
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/css'
      }

      const data = fs.createReadStream('theme/style.css')
      const body = new NodeReadableToWebReadable(data)

      return new Response(body, {
        status,
        headers
      })
    }

    try {
      const resolvedPath = await resolveFile(toResolve)
      const status = 200

      const contentType = mime.getType(resolvedPath) || 'text/plain'

      const data = fs.createReadStream(resolvedPath)
      const body = new NodeReadableToWebReadable(data)

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': 'agregore://welcome',
        'Cache-Control': 'no-cache',
        'Content-Type': contentType
      }

      return new Response(body, {
        status,
        headers
      })
    } catch (e) {
      const status = 404

      const data = fs.createReadStream('404.html')
      const body = new NodeReadableToWebReadable(data)

      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Allow-CSP-From': '*',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/html'
      }

      return new Response(body, {
        status,
        headers
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

class NodeReadableToWebReadable extends ReadableStream {
  constructor (nodeReadable) {
    super({
      start (controller) {
        console.log('Starting')
        nodeReadable.on('data', (chunk) => {
          console.log(chunk)
          controller.enqueue(chunk)
        })
        nodeReadable.on('end', () => {
          console.log('done')
          controller.close()
        })
        nodeReadable.on('error', (err) => controller.error(err))
      }
    })
  }
}
