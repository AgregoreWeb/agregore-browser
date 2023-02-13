import {
  BrowserWindow,
  BrowserView,
  ipcMain,
  app
} from 'electron'
import path from 'node:path'
import EventEmitter from 'node:events'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'

import Config from './config.js'

const {
  defaultPage,
  autoHideMenuBar: DEFAULT_AUTO_HIDE_MENU_BAR
} = Config

const IS_DEBUG = process.env.NODE_ENV === 'debug'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

const MAIN_PAGE = path.join(__dirname, './ui/index.html')
const LOGO_FILE = path.join(__dirname, './../build/icon-small.png')
const PERSIST_FILE = path.join(app.getPath('userData'), 'lastOpened.json')

const DEFAULT_SAVE_INTERVAL = 30 * 1000

const WINDOW_METHODS = [
  'goBack',
  'goForward',
  'reload',
  'focus',
  'loadURL',
  'getURL',
  'findInPage',
  'stopFindInPage',
  'setBounds',
  'searchHistory',
  'listExtensionActions',
  'clickExtensionAction'
]

const BLINK_FLAGS = [
  'WebBluetooth',
  'WebBluetoothGetDevices',
  'WebBluetoothRemoteCharacteristicNewWriteValue',
  'WebBluetoothWatchAdvertisements',
  'CSSModules'
].join(',')

async function DEFAULT_SEARCH () {
  return []
}

async function DEFAULT_LIST_ACTIONS () {
  return []
}

export class WindowManager extends EventEmitter {
  constructor ({
    onSearch = DEFAULT_SEARCH,
    listActions = DEFAULT_LIST_ACTIONS,
    persistTo = PERSIST_FILE,
    saverInterval = DEFAULT_SAVE_INTERVAL
  } = {}) {
    super()
    this.windows = new Set()
    this.onSearch = onSearch
    this.listActions = listActions
    this.persistTo = persistTo
    this.saverTimer = null
    this.saverInterval = saverInterval

    for (const method of WINDOW_METHODS) {
      this.relayMethod(method)
    }
  }

  open (opts = {}) {
    const { onSearch, listActions } = this
    const window = new Window({
      onSearch,
      listActions,
      ...opts
    })

    console.log('created window', window.id)
    this.windows.add(window)
    window.once('close', () => {
      this.windows.delete(window)
      this.emit('close', window)
    })
    window.on('navigating', () => {
      this.restartSaver()
    })
    this.emit('open', window)

    window.load()

    return window
  }

  relayMethod (name) {
    ipcMain.handle(`agregore-window-${name}`, ({ sender }, ...args) => {
      const { id } = sender
      if (IS_DEBUG) console.log('<-', id, name, '(', args, ')')
      const window = this.get(id)
      if (!window) return console.warn(`Got method ${name} from invalid frame ${id}`)
      return window[name](...args)
    })
  }

  reloadBrowserActions (tabId) {
    for (const window of this.all) {
      if (tabId) {
        if (window.web.id === tabId) {
          window.send('browser-actions-changed')
        }
      } else {
        window.send('browser-actions-changed')
      }
    }
  }

  get (id) {
    for (const window of this.windows) {
      if (window.id === id) return window
    }
    return null
  }

  get all () {
    return [...this.windows.values()]
  }

  saveOpened () {
    console.log('Saving open windows')
    let urls = []
    for (const window of this.all) {
      // We don't need to save popups from extensions
      if (window.rawFrame) continue
      const url = window.web.getURL()
      const position = window.window.getPosition()
      const size = window.window.getSize()

      urls.push({ url, position, size })
    }

    if (urls.length === 1) urls = []

    fs.outputJsonSync(this.persistTo, urls)
  }

  async openSaved () {
    const saved = await this.loadSaved()

    return saved.map((info) => {
      console.log('About to open', info)
      const options = {
        noFocus: true
      }

      const { url, position, size } = info

      options.url = url

      if (position) {
        const [x, y] = position
        options.x = x
        options.y = y
      }

      if (size) {
        const [width, height] = size
        options.width = width
        options.height = height
      }

      const window = this.open(options)

      return window
    })
  }

  async loadSaved () {
    try {
      const infos = await fs.readJson(this.persistTo)
      return infos
    } catch (e) {
      console.error('Error loading saved windows', e.stack)
      return []
    }
  }

  close () {
    this.clearSaver()
  }

  restartSaver () {
    this.clearSaver()
    this.startSaver()
  }

  startSaver () {
    this.saverTimer = setTimeout(() => {
      this.saveOpened()
    }, this.saverInterval)
  }

  clearSaver () {
    clearInterval(this.saverTimer)
  }
}

export class Window extends EventEmitter {
  constructor ({
    url = defaultPage,
    popup = false,
    rawFrame = false || popup,
    autoResize = false || popup,
    noNav = false,
    noFocus = false,
    onSearch,
    listActions,
    view,
    autoHideMenuBar = DEFAULT_AUTO_HIDE_MENU_BAR || popup,
    ...opts
  } = {}) {
    super()

    this.onSearch = onSearch
    this.listActions = listActions
    this.rawFrame = rawFrame

    this.window = new BrowserWindow({
      autoHideMenuBar,
      webPreferences: {
        // partition: 'persist:web-content',
        defaultEncoding: 'utf-8',
        nodeIntegration: true,
        webviewTag: false,
        contextIsolation: false
      },
      show: false,
      icon: LOGO_FILE,
      ...opts
    })
    this.view = view || new BrowserView({
      webPreferences: {
        partition: 'persist:web-content',
        defaultEncoding: 'utf-8',
        nodeIntegration: false,
        sandbox: true,
        webviewTag: false,
        contextIsolation: true,
        enableBlinkFeatures: BLINK_FLAGS,
        enablePreferredSizeMode: autoResize
      }
    })

    this.window.setBrowserView(this.view)

    this.web.on('did-start-navigation', (event, url, isInPlace, isMainFrame) => {
      this.emitNavigate(url, isMainFrame)
    })
    this.web.on('did-navigate', (event, url) => {
      this.emitNavigate(url, true)
    })
    this.web.on('did-navigate-in-page', (event, url, isMainFrame) => {
      this.emitNavigate(url, isMainFrame)
    })

    if (autoResize) {
      let reloaded = false
      this.web.on('preferred-size-changed', (event, preferredSize) => {
        const { width, height } = preferredSize
        if (IS_DEBUG) console.log('Preferred size', this.id, preferredSize)
        this.window.setSize(width, height, false)
        this.view.setBounds({
          x: 0,
          y: 0,
          width,
          height
        })

        if (!reloaded) {
          reloaded = true
          this.web.invalidate()
        }
      })
    }

    if (popup) {
      this.web.focus()
      this.window.once('blur', () => {
        if (this.web.isFocused() || this.webContents.isFocused()) return
        if (this.web.isDevToolsOpened() || this.webContents.isDevToolsOpened()) return
        this.window.close()
      })
    }

    // Send to UI
    this.web.on('page-title-updated', (event, title) => {
      this.send('page-title-updated', title)
    })
    this.window.on('enter-html-full-screen', () => {
      this.send('enter-html-full-screen')
    })
    this.window.on('leave-html-full-screen', () => {
      this.send('leave-html-full-screen')
    })
    this.web.on('update-target-url', (event, url) => {
      this.send('update-target-url', url)
    })

    this.window.once('ready-to-show', () => this.window.show())
    this.window.on('close', () => {
      this.web.destroy()
      this.emit('close')
    })

    const toLoad = new URL(MAIN_PAGE, 'file:')

    if (url) toLoad.searchParams.set('url', url)
    if (rawFrame) toLoad.searchParams.set('rawFrame', 'true')
    if (noNav) toLoad.searchParams.set('noNav', 'true')
    if (noFocus) toLoad.searchParams.set('noFocus', 'true')

    this.toLoad = toLoad.href
  }

  load () {
    return this.window.loadURL(this.toLoad)
  }

  emitNavigate (url, isMainFrame) {
    if (!isMainFrame) return
    if (IS_DEBUG) console.log('Navigating', url)
    const canGoBack = this.web.canGoBack()
    const canGoForward = this.web.canGoForward()

    this.send('navigating', url)
    this.send('history-buttons-change', { canGoBack, canGoForward })
  }

  async goBack () {
    return this.web.goBack()
  }

  async goForward () {
    return this.web.goForward()
  }

  async reload () {
    return this.web.reload()
  }

  async focus () {
    return this.web.focus()
  }

  async loadURL (url) {
    return this.web.loadURL(url)
  }

  async getURL () {
    return this.web.getURL()
  }

  async findInPage (value, opts) {
    return this.web.findInPage(value, opts)
  }

  async stopFindInPage () {
    return this.web.stopFindInPage('clearSelection')
  }

  async searchHistory (...args) {
    return this.onSearch(...args)
  }

  async setBounds (rect) {
    // Fix non-integer heights causing draw break.
    // TODO: This should be fixed wherever rect is sent from, not sure where that is.
    Object.keys(rect).forEach(key => {
      rect[key] = Math.floor(rect[key])
    })

    // Fix MacOS setBounds not considering the titlebar height
    const titleBarHeight = this.getTitleBarHeight()
    if (titleBarHeight && rect.y) {
      rect.y += titleBarHeight
    }

    return this.view.setBounds(rect)
  }

  getTitleBarHeight () {
    const winHeight = this.window.getSize()[1]
    const contentHeight = this.window.getContentSize()[1]
    const titlebarHeight = winHeight - contentHeight

    return process.platform === 'darwin' ? titlebarHeight : 0
  }

  async listExtensionActions () {
    const actions = await this.listActions(this)
    return actions.map(({
      title,
      extensionId: id,
      icon,
      badge,
      badgeColor,
      badgeBackground
    }) => {
      return {
        title,
        id,
        icon,
        badge: {
          text: badge,
          color: badgeColor,
          background: badgeBackground
        }
      }
    })
  }

  async clickExtensionAction (actionId) {
    await this.focus()
    for (const { extensionId, onClick } of await this.listActions()) {
      if (actionId !== extensionId) continue
      await onClick(this.web.id)
    }
  }

  send (name, ...args) {
    this.emit(name, ...args)
    if (IS_DEBUG) console.log('->', this.id, name, '(', args, ')')
    this.window.webContents.send(`agregore-window-${name}`, ...args)
  }

  get web () {
    return this.view.webContents
  }

  get webContents () {
    return this.window.webContents
  }

  get id () {
    return this.window.webContents.id
  }
}
