const { app, BrowserWindow, session } = require('electron')
const fs = require('fs-extra')
const { sep } = require('path')

const packageJSON = require('../package.json')
const protocols = require('./protocols')
const { createActions } = require('./actions')
const { registerMenu } = require('./menu')
const { attachContextMenus } = require('./context-menus')
const { WindowManager } = require('./window')
const { createExtensions } = require('./extensions')
const history = require('./history')

const { extensions: extensionsConfig } = require('./config')
const { dir: extensionsDir } = extensionsConfig

const WEB_PARTITION = 'persist:web-content'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, argv, workingDirectory) => {
    const urls = urlsFromArgs(argv.slice(1), workingDirectory)
    urls.map((url) => windowManager.open({ url }))
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

// Enable flags for using Wayland rendering
// Based on this: https://blogs.igalia.com/adunaev/2020/11/13/hidpi-support-in-chromium-for-wayland/
// TODO: Should we do something similar for x11?
if (process.env.XDG_SESSION_TYPE === 'wayland') {
  app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform')
  app.commandLine.appendSwitch('ozone-platform', 'wayland')
}

const extensions = createExtensions({ partition: WEB_PARTITION, createWindow })

const windowManager = new WindowManager({
  onSearch: (...args) => history.search(...args),
  listActions: (...args) => extensions.listActions(...args)
})

protocols.registerPriviledges()

windowManager.on('open', (window) => {
  attachContextMenus({ window, createWindow })
  if (!window.rawFrame) {
    const asBrowserView = BrowserWindow.fromBrowserView(window.view)
    extensions.addWindow(asBrowserView)
    asBrowserView.on('focus', () => extensions.setActiveTab(window.web.id))
  }
  window.on('new-window', (event, url, frameName, disposition, options) => {
    console.log('New window', url, disposition)
    if ((disposition === 'foreground-tab') || (disposition === 'background-tab')) {
      event.preventDefault()
      event.newGuest = null
      createWindow(url)
    } else if (options && options.webContents) attachContextMenus({ window: options, createWindow })
  })
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(onready)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
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
})

async function onready () {
  const webSession = session.fromPartition(WEB_PARTITION)

  webSession.setUserAgent(`AgregoreDesktop/${packageJSON.version}`)

  const actions = createActions({
    createWindow
  })

  await protocols.setupProtocols(webSession)
  await registerMenu(actions)

  // Register extensions that came bundled with the browser
  await extensions.registerInternal()

  // Register extensions that users installed externally
  await extensions.registerExternal()

  const existsExtensions = await fs.pathExists(extensionsDir)

  if (existsExtensions) await extensions.registerAll(extensionsDir)

  const historyExtension = await extensions.get('agregore-history')
  history.setExtension(historyExtension)

  const opened = await windowManager.openSaved()

  const urls = urlsFromArgs(process.argv.slice(1), process.cwd())
  if (urls.length) {
    urls.map((url) => {
      windowManager.open({ url })
    })
  } else if (!opened.length) windowManager.open()
}

function createWindow (url, options = {}) { return windowManager.open({ url, ...options }) }

function urlsFromArgs (argv, workingDir) {
  const rootURL = new URL(workingDir + sep, 'file://')
  return argv
    .filter((arg) => arg.includes('/'))
    .map((arg) => arg.includes('://') ? arg : (new URL(arg, rootURL)).href)
}
