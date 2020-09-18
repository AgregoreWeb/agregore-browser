const {
  BrowserWindow,
  BrowserView,
  ipcMain,
  app
} = require('electron')
const path = require('path')
const EventEmitter = require('events')
const fs = require('fs-extra')

const MAIN_PAGE = path.resolve(__dirname, '../ui/index.html')
const LOGO_FILE = path.join(__dirname, '../../build/icon.png')
const PERSIST_FILE = path.join(app.getPath('userData'), 'lastOpened.json')

const DEFAULT_PAGE = 'agregore://welcome'

const IS_DEBUG = process.env.NODE_ENV === 'debug'

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
  'searchHistory'
]

async function DEFAULT_SEARCH () {
  return []
}

class WindowManager extends EventEmitter {
  constructor ({
    onSearch = DEFAULT_SEARCH,
    persistTo = PERSIST_FILE
  } = {}) {
    super()
    this.windows = new Set()
    this.onSearch = onSearch
    this.persistTo = persistTo

    for (const method of WINDOW_METHODS) {
      this.relayMethod(method)
    }
  }

  open (opts = {}) {
    const { onSearch } = this
    const window = new Window({ ...opts, onSearch })

    console.log('created window', window.id)
    this.windows.add(window)
    window.once('close', () => {
      this.windows.delete(window)
      this.emit('close', window)
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

  async saveOpened () {
    let urls = await Promise.all(this.all.map(async (window) => {
      const url = window.web.getURL()
      const position = window.window.getPosition()
      const size = window.window.getSize()

      return { url, position, size }
    }))

    if (urls.length === 1) urls = []

    fs.outputJsonSync(this.persistTo, urls)
  }

  async openSaved () {
    const saved = await this.loadSaved()

    return Promise.all(saved.map((info) => {
      console.log('About to open', info)
      const options = {}

      if (typeof info === 'string') {
        options.url = info
      } else {
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
      }

      return this.open(options)
    }))
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
}

class Window extends EventEmitter {
  constructor ({
    url = DEFAULT_PAGE,
    rawFrame = false,
    onSearch,
    ...opts
  } = {}) {
    super()

    this.onSearch = onSearch

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

    this.view = new BrowserView({
      webPreferences: {
        partition: 'persist:web-content',
        nodeIntegration: false,
        sandbox: true,
        webviewTag: false,
        contextIsolation: true
      }
    })
    this.window.setBrowserView(this.view)

    this.web.on('did-navigate', (event, url, isMainFrame) => {
      console.log('Navigating', url, isMainFrame)
      if (!isMainFrame) return
      this.send('navigating', url)
    })
    this.web.on('did-navigate', () => {
      const canGoBack = this.web.canGoBack()
      const canGoForward = this.web.canGoForward()

      this.send('history-buttons-change', { canGoBack, canGoForward })
    })
    this.web.on('page-title-updated', (event, title) => {
      this.send('page-title-updated', title)
    })
    this.window.once('ready-to-show', () => this.window.show())
    this.window.on('close', () => {
      if (this.view.destroy) this.view.destroy()
      this.emit('close')
    })

    const toLoad = new URL(MAIN_PAGE, 'file:')

    if (url) toLoad.searchParams.set('url', url)
    if (rawFrame) toLoad.searchParams.set('rawFrame', 'true')

    this.toLoad = toLoad.href

    if (IS_DEBUG) {
      // this.web.openDevTools()
      this.window.webContents.openDevTools()
    }
  }

  load () {
    return this.window.loadURL(this.toLoad)
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
    return this.view.setBounds(rect)
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
