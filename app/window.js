const {
  BrowserWindow,
  BrowserView,
  ipcMain,
  app
} = require('electron')
const path = require('path')
const EventEmitter = require('events')
const fs = require('fs-extra')

const MAIN_PAGE = path.resolve(__dirname, './ui/index.html')
const LOGO_FILE = path.join(__dirname, './../build/icon.png')
const PERSIST_FILE = path.join(app.getPath('userData'), 'lastOpened.json')

const IS_DEBUG = process.env.NODE_ENV === 'debug'

const DEFAULT_SAVE_INTERVAL = 30 * 1000

const { defaultPage } = require('./config')

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

class WindowManager extends EventEmitter {
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
      console.log('<-', id, name, '(', args, ')')
      const window = this.get(id)
      if (!window) return console.warn(`Got method ${name} from invalid frame ${id}`)
      return window[name](...args)
    })
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
      const options = {}

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

class Window extends EventEmitter {
  constructor ({
    url = defaultPage,
    rawFrame = false,
    noNav = false,
    noAutoFocus = false,
    onSearch,
    listActions,
    view,
    ...opts
  } = {}) {
    super()

    this.onSearch = onSearch
    this.listActions = listActions
    this.rawFrame = rawFrame

    this.window = new BrowserWindow({
      autoHideMenuBar: true,
      webPreferences: {
        // partition: 'persist:web-content',
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
        nodeIntegration: false,
        sandbox: true,
        webviewTag: false,
        contextIsolation: true,
        enableBlinkFeatures: BLINK_FLAGS
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
    this.web.on('new-window', (...args) => {
      this.emit('new-window', ...args)
    })

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

    this.toLoad = toLoad.href

    if (IS_DEBUG) {
      // this.web.openDevTools()
      this.window.webContents.openDevTools()
    }
  }

  load () {
    return this.window.loadURL(this.toLoad)
  }

  emitNavigate (url, isMainFrame) {
    if (!isMainFrame) return
    console.log('Navigating', url)
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
    Object.keys(rect).forEach(key => {
      rect[key] = Math.floor(rect[key])
    })
    // Fix non-integer heights causing draw break.
    // TODO: This should be fixed wherever rect is sent from, not sure where that is.

    return this.view.setBounds(rect)
  }

  async listExtensionActions () {
    const actions = await this.listActions()
    return actions.map(({ title, id, icon }) => ({ title, id, icon }))
  }

  async clickExtensionAction (actionId) {
    await this.focus()
    for (const { id, onClick } of await this.listActions()) {
      if (actionId !== id) continue
      await onClick(this.id)
    }
  }

  send (name, ...args) {
    this.emit(name, ...args)
    console.log('->', this.id, name, '(', args, ')')
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

module.exports = { WindowManager, Window }
