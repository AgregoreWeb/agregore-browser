const path = require('path')
const fs = require('fs-extra')

const { ExtensibleSession } = require('../../node_modules/electron-extensions/main')
const { webContents } = require('electron')

const DEFAULT_PARTITION = 'persist:web-content'

let extensions = null
let createWindow = null

module.exports = {
  init,
  registerExtensions,
  getExtension,
  listActions
}

async function listActions () {
  /* eslint-disable camelcase */
  return Object.keys(extensions.extensions)
    .map(getExtension)
    .filter(({ manifest }) => manifest.browser_action)
    .map(({ popupPage, backgroundPage, manifest, id, path: extensionPath }) => {
      const { browser_action, name } = manifest
      const title = browser_action.default_title || name
      const onClick = popupPage ? () => {
        createWindow(popupPage, { rawFrame: true })
      } : (tabId) => {
        const tab = webContents.fromId(tabId)
        backgroundPage.webContents.send('api-emit-event-browserAction-onClicked', tab)
      }
      const { default_icon } = browser_action
      const iconRelative = (typeof default_icon === 'string') ? default_icon : (default_icon[19] || default_icon[38])
      const icon = new URL(path.join(extensionPath, iconRelative), 'file:///').href
      return {
        title,
        icon,
        onClick
      }
    })
}

function getExtension (name) {
  return extensions.extensions[name]
}

async function init ({ partition = DEFAULT_PARTITION, createWindow: _createWindow } = {}) {
  createWindow = _createWindow

  extensions = new ExtensibleSession({
    partition,
    blacklist: ['agregore-browser://*/*', 'file://*/*']
  })

  await registerExtensions()
}
async function registerExtensions () {
  const rawNames = await fs.readdir(__dirname)
  const stats = await Promise.all(
    rawNames.map(
      (name) => fs.stat(
        path.join(__dirname, name)
      )
    )
  )

  const extensionFolders = rawNames.filter((name, index) => stats[index].isDirectory())

  console.log('Loading extensions', extensionFolders)

  for (const folder of extensionFolders) {
    try {
      const extension = await extensions.loadExtension(path.join(__dirname, folder))
      console.log('Loaded extension', extension)

      if (process.env.MODE === 'debug') {
        if (extension.backgroundPage) extension.backgroundPage.webContents.openDevTools()
      }
    } catch (e) {
      console.error('Error loading extension', folder, e)
    }
  }

  return extensions
}
