const { app, BrowserWindow } = require('electron')
const { resolve } = require('path')

const protocols = require('./protocols')

const MAIN_PAGE = resolve(__dirname, './ui/index.html')

function createWindow (url) {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })

  const toLoad = new URL(MAIN_PAGE, 'file:')

  if (url) toLoad.searchParams.set('url', url)

  // and load the index.html of the app.
  win.loadURL(toLoad.href)

  // Open the DevTools.
  if (process.env.MODE === 'debug') {
    win.webContents.openDevTools()
  }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, argv) => {
    const urls = argv.filter((arg) => arg.includes('://'))
    urls.map(createWindow)
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

async function onready () {
  await protocols.setupProtocols()
  const urls = process.argv.filter((arg) => arg.includes('://'))
  if (urls.length) urls.map(createWindow)
  else createWindow()
}
