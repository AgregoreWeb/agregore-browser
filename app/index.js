import { app, BrowserWindow, session, Menu, Tray } from 'electron'
import path, { sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as protocols from './protocols/index.js'
import { createActions } from './actions.js'
import { registerMenu } from './menu.js'
import { attachContextMenus } from './context-menus.js'
import { WindowManager } from './window.js'
import { createExtensions } from './extensions/index.js'
import * as history from './history.js'
import { version } from './version.js'

const IS_DEBUG = process.env.NODE_ENV === 'debug'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

const WEB_PARTITION = 'persist:web-content'
const LOGO_FILE = path.join(__dirname, './../build/icon-small.png')

if (IS_DEBUG) {
  app.on('web-contents-created', (event, webContents) => {
    webContents.openDevTools()
  })
}

process.on('SIGINT', () => app.quit())

let extensions = null
let windowManager = null

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

init()

function init () {
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()
    return
  }

  windowManager = new WindowManager({
    onSearch: (...args) => history.search(...args),
    listActions: (...args) => extensions.listActions(...args)
  })

  app.on('second-instance', (event, argv, workingDirectory) => {
    console.log('Got signal from second instance', argv)
    const urls = urlsFromArgs(argv.slice(1), workingDirectory)
    urls.map((url) => windowManager.open({ url }))
  })

  windowManager.on('open', window => {
    attachContextMenus({ window, createWindow, extensions })
    if (!window.rawFrame) {
      const asBrowserView = BrowserWindow.fromBrowserView(window.view)
      asBrowserView.on('focus', () => {
        window.web.focus()
      })
    }

    window.web.setWindowOpenHandler(({ url, features, disposition }) => {
      console.log('New window', url, disposition)
      if ((disposition === 'foreground-tab') || (disposition === 'background-tab')) {
        createWindow(url)

        return { action: 'deny' }
      } else {
        // TODO: Should we override more options here?
        return { action: 'allow' }
      }
    })

    window.web.on('did-create-window', (window) => {
      attachContextMenus({ window, createWindow, extensions })
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(onready).catch((e) => {
  console.error(e)
  process.exit(1)
})

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
  protocols.close()
})

app.on('window-all-closed', () => {})
async function onready () {
  console.log('Building tray and context menu')
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
  appIcon.on('click', () => {
    createWindow()
  })

  const webSession = session.fromPartition(WEB_PARTITION)

  const electronSection = /Electron.+ /i
  const existingAgent = webSession.getUserAgent()
  const newAgent = existingAgent.replace(electronSection, `AgregoreDesktop/${version} `)

  webSession.setUserAgent(newAgent)
  session.defaultSession.setUserAgent(newAgent)

  const actions = createActions({
    createWindow
  })

  console.log('Setting up protocol handlers')

  await protocols.setupProtocols(webSession)

  console.log('Registering context menu')

  await registerMenu(actions)

  function updateBrowserActions (tabId, actions) {
    windowManager.reloadBrowserActions(tabId)
  }

  console.log('Initializing extensions')

  extensions = createExtensions({ session: webSession, createWindow, updateBrowserActions })

  console.log('Extracting internal extensions')

  // Extract any internal extensions if there are updates
  await extensions.extractInternal()

  console.log('Registering extensions from disk')

  // Register all extensions in the extensions folder from disk
  await extensions.registerAll()

  // TODO: Better error handling when the extension doesn't exist?
  history.setGetBackgroundPage(() => {
    return extensions.getBackgroundPageByName('agregore-history')
  })

  console.log('Opening saved windows')

  const opened = await windowManager.openSaved()

  const urls = urlsFromArgs(process.argv.slice(1), process.cwd())
  if (urls.length) {
    for (const url of urls) {
      windowManager.open({ url })
    }
  } else if (!opened.length) windowManager.open()

  console.log('Waiting for windows to settle')

  await new Promise((resolve) => setTimeout(resolve, 5000))

  protocols.setAsDefaultProtocolClient()

  console.log('Initialization done')
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
