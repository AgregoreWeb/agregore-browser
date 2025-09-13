import path from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import EventEmitter from 'node:events'
import fs from 'fs-extra'
import semver from 'semver'
import decompress from 'decompress'

import { ExtendedExtensions } from 'electron-extended-webextensions'

// TODO: This smells! Inject options in constructor
import Config from '../config.js'

const { dir: extensionsDir, remote } = Config.extensions

// Handle `app.asar` Electron functionality so that extensions can be referenced on the FS
// Also note that MacOS uses `app-arm64.asar`, so we should target the first `.asar/`
const __dirname = fileURLToPath(new URL('./', import.meta.url)).replace(`.asar${path.sep}`, `.asar.unpacked${path.sep}`)
const DEFAULT_EXTENSION_LOCATION = path.join(__dirname, 'builtins')
const DEFAULT_EXTENSION_LIST_LOCATION = path.join(__dirname, 'builtins.json')

export class Extensions extends EventEmitter {
  constructor ({
    session,
    createWindow,
    updateBrowserActions,
    builtinsLocation = DEFAULT_EXTENSION_LOCATION,
    builtinsListLocation = DEFAULT_EXTENSION_LIST_LOCATION,
    storageLocation = extensionsDir
  }) {
    super()
    this.createWindow = createWindow
    this.updateBrowserActions = updateBrowserActions
    this.session = session

    this.builtinsLocation = builtinsLocation
    this.builtinsListLocation = builtinsListLocation
    this.storageLocation = storageLocation

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

  async getManifestVersionOnDisk (name) {
    const manifestLocation = path.join(this.storageLocation, name, 'manifest.json')

    try {
      const manifestJSON = await readFile(manifestLocation)
      const { version } = JSON.parse(manifestJSON)

      return version
    } catch (e) {
      console.error(`Unable to load manifest for ${name}. ${e.stack}`)
      return '0.0.0'
    }
  }

  async extractIfNew (name, info) {
    const existingVersion = await this.getManifestVersionOnDisk(name)
    const isNew = semver.lt(existingVersion, info.version)
    if (!isNew) return false
    const zipLocation = path.join(this.builtinsLocation, `${name}.zip`)
    const extensionLocation = path.join(this.storageLocation, name)
    const decompressOptions = {}
    if (info.stripPrefix) {
      decompressOptions.map = (file) => {
        if (file.path.startsWith(info.stripPrefix)) {
          file.path = file.path.slice(info.stripPrefix.length)
        }
        return file
      }
    }
    await decompress(zipLocation, extensionLocation, decompressOptions)
    return true
  }

  async extractInternal () {
    // Read builtins list
    const builtinsListJSON = await readFile(this.builtinsListLocation, 'utf8')
    console.log({ builtinsListJSON })
    const builtins = await JSON.parse(builtinsListJSON)

    const builtinsEntries = [...Object.entries(builtins)]
    // Extract them all in paralell
    await Promise.all(builtinsEntries.map(([name, info]) => {
      return this.extractIfNew(name, info)
    }))
  }

  async registerAll (extensionsFolder = this.storageLocation) {
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

export function createExtensions (opts) {
  return new Extensions(opts)
}
