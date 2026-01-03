import cenc from 'compact-encoding'
import { ipcMain } from 'electron'
import path from 'path'
import RocksDB from 'rocksdb-native'
import { fileURLToPath } from 'url'

/** @import {OnLoadHandler, OnDeleteHandler} from "hypercore-fetch" */

/**
 * @typedef {object} SiteWriteInfo
 * @property {boolean} writable
 * @property {string} [name]
 */

/**
 * @typedef {object} SiteDynamicInfo
 * @property {number} lastUsed
 * @property {number} firstUsed
 * @property {string} url
 */

/** @typedef {SiteWriteInfo & SiteDynamicInfo} SiteInfo */

const __dirname = fileURLToPath(new URL('./', import.meta.url))

/**
 * @param {LocalSiteTracker} tracker
 */
export function registerSiteTrackerRPC (tracker) {
  ipcMain.handle('sites-list', async () => {
    return tracker.list()
  })
}

/**
 * @param {import('electron').Session} session
 */
export function addPreloads (session) {
  const filePath = path.join(__dirname, 'localsites-preload.js')
  session.registerPreloadScript({
    type: 'frame',
    id: 'agregore-localsites',
    filePath
  })
}

export class LocalSiteTracker {
  #db
  /** @type RocksDB<string, SiteWriteInfo> */
  #siteInfo
  /** @type RocksDB<string, number> */
  #siteLastUsed
  /** @type RocksDB<string, number> */
  #siteFirstUsed

  /**
   *
   * @param {string} storageLocation
   */
  constructor (storageLocation) {
    this.#db = new RocksDB(storageLocation)
    this.#siteInfo = this.#db.session({
      columnFamily: 'local_sites',
      keyEncoding: cenc.raw.string,
      valueEncoding: cenc.raw.json
    })
    this.#siteLastUsed = this.#db.session({
      columnFamily: 'local_sites_accessed',
      keyEncoding: cenc.raw.string,
      valueEncoding: cenc.uint64
    })
    this.#siteFirstUsed = this.#db.session({
      columnFamily: 'local_sites_created',
      keyEncoding: cenc.raw.string,
      valueEncoding: cenc.uint64
    })
  }

  /**
   * Invoke when a site is created or navigated to
   * Tracks info locally and updates the lastAccessed timestamp
   * @type {OnLoadHandler}
   */
  onLoad (url, writable, name) {
    this.#update(url.toString(), {
      writable,
      name
    })
  }

  /**
   * @type {OnDeleteHandler}
   */
  onDelete (url) {
    this.#delete(url.toString())
  }

  /**
   * @param {string} url
   */
  async #delete (url) {
    await this.#siteInfo.delete(url)
    await this.#siteInfo.flush()
    await this.#siteLastUsed.delete(url)
    await this.#siteLastUsed.flush()
  }

  /**
   * @param {string} url
   * @param {SiteWriteInfo} info
   */
  async #update (url, info) {
    const existing = await this.#siteInfo.get(url)

    const { writable, name } = info

    if (!existing) {
      await this.#siteInfo.put(url, {
        writable,
        name
      })
      await this.#siteInfo.flush()
      await this.#siteFirstUsed.put(url, Date.now())
      await this.#siteFirstUsed.flush()
    }
    await this.#siteLastUsed.put(url, Date.now())
    await this.#siteLastUsed.flush()
  }

  /**
   * Get site info for a URL
   * @param {string} url
   * @returns {Promise<SiteInfo?>}
   */
  async infoFor (url) {
    const writeInfo = await this.#siteInfo.get(url)

    if (!writeInfo) return null
    const firstUsed = await this.#siteFirstUsed.get(url)
    // This should never happen
    if (!firstUsed) return null
    const lastUsed = await this.#siteLastUsed.get(url)
    // This should never happen
    if (!lastUsed) return null

    return { ...writeInfo, lastUsed, firstUsed, url }
  }

  /**
   * List all known site info
   * @returns {Promise<SiteInfo[]>}
   */
  async list () {
    /** @type {SiteInfo[]} */
    const items = []
    for await (const { key: url, value: lastUsed } of this.#siteLastUsed.iterator()) {
      const writeInfo = await this.#siteInfo.get(url)
      const firstUsed = await this.#siteFirstUsed.get(url) ?? Date.now()
      // This should never happen!
      if (!writeInfo) continue
      items.push({
        ...writeInfo,
        url,
        lastUsed,
        firstUsed
      })
    }
    return items
  }

  async close () {
    await this.#db.close()
  }
}
