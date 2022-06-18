#!/usr/bin/env node

const { extensionFlat } = require('@netless/extension-flat')

const EXTENSIONS = {
  'archiveweb.page': 'fpeoodllldobpkbkabpblcfaogecpndd',
  ublock: 'cjpalhdlnbpafiamejdnhcphjbkeiagm'
}

const EXTENSION_FOLDER = require('path').join(__dirname, 'app/extensions')

for (const [name, hash] of Object.entries(EXTENSIONS)) {
  downloadExtension(name, hash)
}

async function downloadExtension (name, hash) {
  console.log(`Downloading latest ${name} release from the chrome web store`)
  await extensionFlat({
    extensionHash: hash,
    folderName: name,
    outputFolder: EXTENSION_FOLDER,
    deleteCRX: true
  })
  console.log(`Finished downloading and installing ${name}`)
}
