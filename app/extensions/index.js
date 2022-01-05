const path = require('path')
const fs = require('fs-extra')
const EventEmitter = require('events')

const { ExtensibleSession } = require('../../node_modules/electron-extensions/main')
const { webContents } = require('electron')

const { extensions: config } = require('../config')
const { dir: extensionsDir, remote } = config

const DEFAULT_PARTITION = 'persist:web-content'
const DEFAULT_BLACKLIST = ['agregore-browser://*/*', 'file://*/*']
const DEFAULT_EXTENSION_LOCATION = __dirname

module.exports = {
  createExtensions
}

class Extensions extends EventEmitter {
  constructor ({
    partition = DEFAULT_PARTITION,
    blacklist = DEFAULT_BLACKLIST,
    createWindow,
    location = DEFAULT_EXTENSION_LOCATION
  }) {
    super()
    this.partition = partition
    this.blacklist = blacklist
    this.createWindow = createWindow
    this.location = location

    this.extensions = new ExtensibleSession({
      partition,
      blacklist
    })

    this.extensions.on('create-tab', (details, onCreate) => {
      const {url, width, height} = details
      const window = createWindow({url, width, height})

      onCreate(window.web.id)
    })
  }

  async listActions () {
    /* eslint-disable camelcase */
    return Object.keys(this.all)
      .map((name) => this.get(name))
      .filter(({ manifest }) => manifest.browser_action)
      .map(({ popupPage, backgroundPage, manifest, id, path: extensionPath }) => {
        const { browser_action, name } = manifest
        const title = browser_action.default_title || name
        const onClick = popupPage
          ? () => {
            this.createWindow(popupPage, {
              rawFrame: true,
              autoResize: true,
              height: 400,
              width: 256
            })
          }
          : (tabId) => {
            const tab = webContents.fromId(tabId)
            backgroundPage.webContents.send('api-emit-event-browserAction-onClicked', tab)
          }
        const { default_icon } = browser_action
        const iconRelative = (typeof default_icon === 'string') ? default_icon : findIcon(default_icon)
        const icon = new URL(path.join(extensionPath, iconRelative), 'file:///').href
        return {
          id: name,
          title,
          icon,
          onClick
        }
      })
  }

  get all () {
    return this.extensions.extensions
  }

  get (name) {
    return this.all[name]
  }

  async loadRemote () {
    if (!remote) return
    for (const url of remote) {
      // TODO: Implement this for different protocols
      this.loadFromURL(url)
    }
  }

  async loadExtension (path) {
    return this.extensions.loadExtension(path)
  }

  async registerExternal () {
    const existsExtensions = await fs.pathExists(extensionsDir)

    if (existsExtensions) await this.registerAll(extensionsDir)
  }

  async registerInternal () {
    await this.registerAll(this.location)
  }

  async registerAll (extensionsFolder = this.location) {
    const rawNames = await fs.readdir(extensionsFolder)
    const stats = await Promise.all(
      rawNames.map(
        (name) => fs.stat(
          path.join(extensionsFolder, name)
        )
      )
    )

    const extensionFolders = rawNames.filter((name, index) => stats[index].isDirectory())

    console.log('Loading extensions', extensionFolders)

    for (const folder of extensionFolders) {
      try {
        const extension = await this.loadExtension(path.join(extensionsFolder, folder))
        console.log('Loaded extension', extension)

        if (process.env.NODE_ENV === 'debug') {
          if (extension.backgroundPage) extension.backgroundPage.webContents.openDevTools()
        }
      } catch (e) {
        console.error('Error loading extension', folder, e)
      }
    }
  }

  setActiveTab (tabId) {
    this.extensions.activeTab = tabId
  }

  addWindow (window) {
    this.extensions.addWindow(window)
  }
}

function createExtensions (opts) {
  return new Extensions(opts)
}

function findIcon (iconList) {
  for (const size of [38, 32, 19, 16]) {
    if (iconList[size]) return iconList[size]
  }
}
