const { app, BrowserWindow, session, Tray } = require('electron')
const path = require('path')

const protocols = require('./protocols')
const { registerMenu } = require('./menu')
const { createWindow, saveOpen, loadFromHistory } = require('./windows')
const { registerExtensions } = require('./extensions')
const history = require('./history')

const LOGO_FILE = path.join(__dirname, '../build/icon.png')
const WEB_PARTITION = 'persist:web-content'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, argv) => {
    const urls = argv.filter((arg) => arg.includes('://'))
    urls.map((url) => createWindow(url))
  })
}

protocols.registerPriviledges()

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
    createWindow()
  }
})

app.on('before-quit', () => {
  saveOpen()
})

async function onready () {
  const tray = new Tray(LOGO_FILE)
  tray.setToolTip('Agregore')
  const webSession = session.fromPartition(WEB_PARTITION)

  await protocols.setupProtocols(webSession)
  await registerMenu()

  const extensions = await registerExtensions(webSession)

  const historyExtension = extensions.extensions['agregore-history']
  history.setExtension(historyExtension)

  const rootURL = new URL(process.cwd(), 'file://')

  const urls = process.argv
    .slice(2)
    .filter((arg) => arg.includes('/'))
    .map((arg) => arg.includes('://') ? arg : (new URL(arg, rootURL)).href)
  if (urls.length) urls.map(createWindow)
  else {
    const opened = await loadFromHistory()
    if (!opened.length) createWindow()
  }
}
