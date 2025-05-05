import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import mime from 'mime-types'
import { Readable } from 'stream'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

export async function createThemeHandler () {
  return {
    handler: async function protocolHandler ({ url }, sendResponse) {
      const parsedUrl = new URL(url)
      let filePath

      if (parsedUrl.hostname === 'theme') {
        const fileName = parsedUrl.pathname.slice(1)
        filePath = path.join(__dirname, '../pages/theme', fileName)
        console.log('Attempting to serve:', filePath)

        if (!fs.existsSync(filePath)) {
          console.log('File not found:', filePath)
          sendResponse({
            statusCode: 404,
            headers: { 'Content-Type': 'text/plain' },
            data: Readable.from(['File not found'])
          })
          return
        }

        const statusCode = 200
        const data = fs.createReadStream(filePath)
        const contentType = mime.lookup(filePath) || 'text/plain'
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
      } else {
        sendResponse({
          statusCode: 404,
          headers: { 'Content-Type': 'text/plain' },
          data: Readable.from(['Not found'])
        })
      }
    }
  }
}
