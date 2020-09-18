const { app, BrowserWindow, session } = require('electron')

const protocols = require('./protocols')
const { createActions } = require('./actions')
const { registerMenu } = require('./menu')
const { attachContextMenus } = require('./context-menus')
const { WindowManager } = require('./window')
const { createExtensions } = require('./extensions')
const history = require('./history')

const WEB_PARTITION = 'persist:web-content'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, argv) => {
    const urls = argv.filter((arg) => arg.includes('://'))
    urls.map((url) => windowManager.open({ url }))
  })
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
})

async function onready () {
  const webSession = session.fromPartition(WEB_PARTITION)

  const actions = createActions({
    createWindow
  })

  await protocols.setupProtocols(webSession)
  await registerMenu(actions)

  await extensions.registerAll()

  const historyExtension = await extensions.get('agregore-history')
  history.setExtension(historyExtension)

  const rootURL = new URL(process.cwd(), 'file://')

  const opened = await windowManager.openSaved()

  const urls = process.argv
    .slice(2)
    .filter((arg) => arg.includes('/'))
    .map((arg) => arg.includes('://') ? arg : (new URL(arg, rootURL)).href)
  if (urls.length) {
    urls.map((url) => {
      windowManager.open({ url })
    })
  } else if (!opened.length) windowManager.open()
}

function createWindow (url, options = {}) { windowManager.open({ url, ...options }) }
