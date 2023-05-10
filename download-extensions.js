#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readFile, mkdir, access } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

const EXTENSION_FOLDER = path.join(__dirname, 'app/extensions')
const EXTENSIONS_LIST_FILE = path.join(EXTENSION_FOLDER, 'builtins.json')
const EXTENSIONS_BUILTINS_FOLDER = path.join(EXTENSION_FOLDER, 'builtins/')

console.log('Loading extension list')

const extensionsJSON = await readFile(EXTENSIONS_LIST_FILE, 'utf8')

try {
  await access(EXTENSIONS_BUILTINS_FOLDER)
} catch {
  console.log(`Creating destination folder:\n${EXTENSIONS_BUILTINS_FOLDER}`)
  await mkdir(EXTENSIONS_BUILTINS_FOLDER)
}

const extensions = JSON.parse(extensionsJSON)

console.log('Downloading extensions')

for (const [name, options] of Object.entries(extensions)) {
  downloadExtension(name, options)
}

async function downloadExtension (name, { version, url, subfolder }) {
  const finalURL = url.replaceAll('{version}', version)
  const destination = path.join(EXTENSIONS_BUILTINS_FOLDER, `${name}.zip`)

  console.log(`Downloading: ${name}`)
  console.log(`URL: ${finalURL}`)
  console.log(`Destination: ${destination}`)

  const response = await fetch(finalURL)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  // Based on this Stack Overflow question: https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
  const fileSourceStream = Readable.fromWeb(response.body)
  const fileDestinationStream = createWriteStream(destination)

  await pipeline(fileSourceStream, fileDestinationStream)
  console.log(`Finished downloading ${name}`)
}
