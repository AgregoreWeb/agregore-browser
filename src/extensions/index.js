import path from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import EventEmitter from 'node:events'
import fs from 'fs-extra'
import semver from 'semver'
import decompress from 'decompress'

import { ExtendedExtensions } from 'electron-extended-webextensions'

/** @import { Window } from '../window.js' */

// TODO: This smells! Inject options in constructor
import Config from '../config.js'

const { dir: extensionsDir, remote } = Config.extensions

// Handle `app.asar` Electron functionality so that extensions can be referenced on the FS
// Also note that MacOS uses `app-arm64.asar`, so we should target the first `.asar/`
const __dirname = fileURLToPath(new URL('./', import.meta.url))
  .replace(`.asar${path.sep}`, `.asar.unpacked${path.sep}`)
const DEFAULT_EXTENSION_LOCATION = path.join(__dirname, 'builtins')
const DEFAULT_EXTENSION_LIST_LOCATION = path.join(__dirname, 'builtins.json')

/**
 * @typedef {Object} ActionItem
 * @property {string} title - The title of the action item.
 * @property {string} extensionId - The unique identifier for the extension.
 * @property {string} icon - The icon URL or class name.
 * @property {string|null} badge - The badge number to display, or null if none.
 * @property {string|null} badgeColor - The color of the badge text, or null if unset.
 * @property {string|null} badgeBackground - The background color of the badge, or null if unset.
 * @property {(tabId?: number) => void} [onClick]
 */

/** @typedef {(tabId: number?, actions: ActionItem[]) => void} UpdateBrowserActionsFN */

/**
 * @typedef {object} ExtensionsOptions
 * @property {import('electron').Session} session
 * @property {(url?:string, options?: import('../window.js').WindowOptions) => Promise<Window>|Window} createWindow
 * @property {UpdateBrowserActionsFN} updateBrowserActions
 * @property {string} [builtinsLocation]
 * @property {string} [builtinsListLocation]
 * @property {string} [storageLocation]
*/

/**
 * @typedef {object} Manifest
 * @property {string} options_page
 */

/**
 * @typedef {object} Extension
 * @property {string} id
 * @property {string} url
 * @property {Manifest} manifest
*/

export class Extensions extends EventEmitter {
  /**
   *
   * @param {ExtensionsOptions} options
   */
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

    /**
     *
     * @param {object} options
     * @param {string} options.url
     * @param {boolean} [options.popup]
     * @param {number} [options.openerTabId]
     * @returns
     */
    async function onCreateTab ({ url, popup, openerTabId }) {
      /**
       * @type {import('../window.js').WindowOptions}
       */
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

  /**
   * @param {Window} window
   * @returns {Promise<ActionItem[]>}
   */
  async listActions (window) {
    const tabId = window ? window.web.id : null

    /**
     * @type {ActionItem[]}
     */
    const actions = await this.extensions.browserActions.list(tabId)

    return actions.map((action) => {
      /** @type {ActionItem['onClick']} */
      const onClick = (clickTabId) => this.extensions.browserActions.click(action.extensionId, clickTabId)
      return { ...action, onClick }
    })
  }

  /**
   *
   * @param {import('electron').WebContents} webContents
   * @param {import('electron').ContextMenuEvent} event
   * @param {any} params
   * @param {any} additionalOpts
   * @returns
   */
  listContextMenuForEvent (webContents, event, params, additionalOpts = {}) {
    return this.extensions.contextMenus.getForEvent(webContents, event, params, additionalOpts)
  }

  get all () {
    return [...this.extensions.extensions.values()]
  }

  /**
   * @param {string} id
   * @returns {Promise<Extension?>}
   */
  async get (id) {
    return this.extensions.get(id)
  }

  /**
   * @param {string} findName
   * @returns {Promise<Extension?>}
   */
  async byName (findName) {
    return this.all.find(({ name }) => name === findName)
  }

  /**
   *
   * @param {string} name
   * @returns {Promise<string?>}
   */
  async getBackgroundPageByName (name) {
    const extension = await this.byName(name)
    if (!extension) return null
    return this.extensions.getBackgroundPage(extension.id)
  }

  async loadRemote () {
    if (!remote) return
    for (const url of remote) {
      // TODO: Implement this for different protocols
      this.loadFromURL(url)
    }
  }

  /**
   * @param {string} _src
   */
  async loadFromURL (_src) {
    // TODO
  }

  /**
   *
   * @param {string} extensionPath
   * @returns
   */
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

  /**
   * @param {string} name Name of extension folder
   * @returns
   */
  async getManifestVersionOnDisk (name) {
    const manifestLocation = path.join(this.storageLocation, name, 'manifest.json')

    try {
      const manifestJSON = await readFile(manifestLocation, 'utf-8')
      const { version } = JSON.parse(manifestJSON)

      return version
    } catch (e) {
      // @ts-ignore It'll be an Error, trust me
      console.error(`Unable to load manifest for ${name}. ${e.stack}`)
      return '0.0.0'
    }
  }

  /**
   *
   * @param {string} name
   * @param {{stripPrefix?:string, version: string}} options
   * @returns
   */
  async extractIfNew (name, { stripPrefix, version }) {
    const existingVersion = await this.getManifestVersionOnDisk(name)
    const isNew = semver.lt(existingVersion, version)
    if (!isNew) return false
    const zipLocation = path.join(this.builtinsLocation, `${name}.zip`)
    const extensionLocation = path.join(this.storageLocation, name)
    /** @type {import('decompress').DecompressOptions} */
    const decompressOptions = {}
    if (typeof stripPrefix === 'string') {
      decompressOptions.map = (file) => {
        if (file.path.startsWith(stripPrefix)) {
          file.path = file.path.slice(stripPrefix?.length)
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

/**
 * Initialize the extensions system
 * @param {ExtensionsOptions} opts
 * @returns {Extensions}
 */
export function createExtensions (opts) {
  return new Extensions(opts)
}
