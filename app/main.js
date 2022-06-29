require('abort-controller/polyfill')
const { app, BrowserWindow, session, Menu, Tray } = require('electron')
const { sep } = require('path')

const IS_DEBUG = process.env.NODE_ENV === 'debug'

const packageJSON = require('../package.json')
const protocols = require('./protocols')
const { createActions } = require('./actions')
const { registerMenu } = require('./menu')
const { attachContextMenus } = require('./context-menus')
const { WindowManager } = require('./window')
const { createExtensions } = require('./extensions')
const history = require('./history')

const WEB_PARTITION = 'persist:web-content'
const path = require('path')
const LOGO_FILE = path.join(__dirname, './../build/icon.png')

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, argv, workingDirectory) => {
    const urls = urlsFromArgs(argv.slice(1), workingDirectory)
    urls.map((url) => windowManager.open({ url }))
  })
}

if (IS_DEBUG) {
  app.on('web-contents-created', (event, webContents) => {
    webContents.openDevTools()
  })
}

// Enable text to speech.
// Requires espeak on Linux
app.commandLine.appendSwitch('enable-speech-dispatcher')

// Smooth scrolling
app.commandLine.appendSwitch('enable-smooth-scrolling')

// Try to use the GPU for video decode on Pinephone
app.commandLine.appendSwitch('enable-accelerated-video-decode')
app.commandLine.appendSwitch('ignore-gpu-blacklist')

// Experimental web platform features, such as the FileSystem API
app.commandLine.appendSwitch('enable-experimental-web-platform-features')

let extensions = null

const windowManager = new WindowManager({
  onSearch: (...args) => history.search(...args),
  listActions: (...args) => extensions.listActions(...args)
})

protocols.registerPrivileges()

windowManager.on('open', window => {
  attachContextMenus({ window, createWindow, extensions })
  if (!window.rawFrame) {
    const asBrowserView = BrowserWindow.fromBrowserView(window.view)
    asBrowserView.on('focus', () => {
      window.web.focus()
    })
  }
  window.on('new-window', (event, url, frameName, disposition, options) => {
    console.log('New window', url, disposition)
    if ((disposition === 'foreground-tab') || (disposition === 'background-tab')) {
      event.preventDefault()
      event.newGuest = null
      createWindow(url)
    } else if (options && options.webContents) {
      attachContextMenus({ window: options, createWindow, extensions })
    }
  })
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(onready)

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    windowManager.open()
  }
})

app.on('before-quit', () => {
  windowManager.saveOpened()
  windowManager.close()
})
app.on('window-all-closed', () => {})
async function onready () {
  const appIcon = new Tray(LOGO_FILE)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'New Window', click: () => createWindow() },
    {
      label: 'Quit',
      role: 'quit'
    }
  ])
  // Call this again for Linux because we modified the context menu
  appIcon.setContextMenu(contextMenu)

  const webSession = session.fromPartition(WEB_PARTITION)

  const electronSection = /Electron.+ /i
  const existingAgent = webSession.getUserAgent()
  const newAgent = existingAgent.replace(electronSection, `AgregoreDesktop/${packageJSON.version} `)

  webSession.setUserAgent(newAgent)
  session.defaultSession.setUserAgent(newAgent)

  const actions = createActions({
    createWindow
  })

  await protocols.setupProtocols(webSession)
  await registerMenu(actions)

  function updateBrowserActions (tabId, actions) {
    windowManager.reloadBrowserActions(tabId)
  }

  extensions = createExtensions({ session: webSession, createWindow, updateBrowserActions })

  // Register extensions that came bundled with the browser
  await extensions.registerInternal()

  // Register extensions that users installed externally
  await extensions.registerExternal()

  // TODO: Better error handling when the extension doesn't exist?
  history.setGetBackgroundPage(() => {
    return extensions.getBackgroundPageByName('agregore-history')
  })

  const opened = await windowManager.openSaved()

  const urls = urlsFromArgs(process.argv.slice(1), process.cwd())
  if (urls.length) {
    for (const url of urls) {
      windowManager.open({ url })
    }
  } else if (!opened.length) windowManager.open()
}

function createWindow (url, options = {}) {
  console.log('createWindow', url, options)
  return windowManager.open({ url, ...options })
}

function urlsFromArgs (argv, workingDir) {
  const rootURL = new URL(workingDir + sep, 'file://')
  return argv
    .filter((arg) => arg.includes('/'))
    .map((arg) => (arg.includes('://') ? arg : (new URL(arg, rootURL)).href))
}
