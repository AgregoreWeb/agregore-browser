const path = require('path')
const fs = require('fs-extra')
const { readdir } = require('fs').promises
const EventEmitter = require('events')

const { ExtendedExtensions } = require('electron-extended-webextensions')

// TODO: This smells! Inject options in constructor
const { extensions: config } = require('../config')
const { dir: extensionsDir, remote } = config

// Handle `app.asar` Electron functionality so that extensions can be referenced on the FS
// Also note that MacOS uses `app-arm64.asar`, so we should target the first `.asar/`
const DEFAULT_EXTENSION_LOCATION = __dirname
  .replace(`.asar${path.sep}`, `.asar.unpacked${path.sep}`)

module.exports = {
  createExtensions
}

class Extensions extends EventEmitter {
  constructor ({
    session,
    createWindow,
    updateBrowserActions,
    location = DEFAULT_EXTENSION_LOCATION
  }) {
    super()
    this.createWindow = createWindow
    this.updateBrowserActions = updateBrowserActions
    this.location = location

    this.session = session

    async function onCreateTab ({ url, popup, openerTabId }) {
      const options = { url }
      if (popup) options.popup = true
      if (openerTabId) options.openerTabId = openerTabId
      const window = await createWindow(url, options)
      return window.web
    }

    this.extensions = new ExtendedExtensions(this.session, {
      onCreateTab
    })

    this.extensions.browserActions.on('change', (actions) => updateBrowserActions(null, actions))
    this.extensions.browserActions.on('change-tab', (tabId, actions) => updateBrowserActions(tabId, actions))
  }

  async listActions (window) {
    const tabId = window ? window.web.id : null
    const actions = await this.extensions.browserActions.list(tabId)
    return actions.map((action) => {
      const onClick = (clickTabId) => this.extensions.browserActions.click(action.extensionId, clickTabId)
      return { ...action, onClick }
    })
  }

  listContextMenuForEvent (webContents, event, params, additionalOpts = {}) {
    return this.extensions.contextMenus.getForEvent(webContents, event, params, additionalOpts)
  }

  get all () {
    return [...this.extensions.extensions.values()]
  }

  async get (id) {
    return this.extensions.get(id)
  }

  async byName (findName) {
    return this.all.find(({ name }) => name === findName)
  }

  async getBackgroundPageByName (name) {
    const extension = await this.byName(name)
    return this.extensions.getBackgroundPage(extension.id)
  }

  async loadRemote () {
    if (!remote) return
    for (const url of remote) {
      // TODO: Implement this for different protocols
      this.loadFromURL(url)
    }
  }

  async loadExtension (extensionPath) {
    const manifestPath = path.join(extensionPath, 'manifest.json')
    const manifestData = await fs.readFile(manifestPath, 'utf8')
    const { name } = JSON.parse(manifestData)
    const exists = await this.byName(name)
    if (exists) {
      return console.warn('Trying to load extension with existing name from', extensionPath, 'with existing extension:', exists)
    }
    return this.extensions.loadExtension(extensionPath)
  }

  async registerExternal () {
    const existsExtensions = await fs.pathExists(extensionsDir)

    if (existsExtensions) await this.registerAll(extensionsDir)
  }

  async registerInternal () {
    await this.registerAll(this.location)
  }

  async registerAll (extensionsFolder = this.location) {
    const rawNames = await readdir(extensionsFolder)
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
        // Must have been skipped
        if (!extension) continue
        console.log('Loaded extension', extension.manifest)

        if (process.env.NODE_ENV === 'debug') {
          // TODO: Open devtools?
        }
      } catch (e) {
        console.error('Error loading extension', folder, e)
      }
    }
  }
}

function createExtensions (opts) {
  return new Extensions(opts)
}
