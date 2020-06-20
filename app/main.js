const { app, BrowserWindow, protocol } = require('electron')
const { join } = require('path')

const createHyperHandler = require('./hyper-protocol')
// const createIPFSHandler = require('./ipfs-protocol')
const createBrowserHandler = require('./browser-protocol')
const createDatHandler = require('./dat-protocol')

const P2P_PRIVILEDGES = {
  standard: true,
  secure: true,
  allowServiceWorkers: true,
  supportFetchAPI: true,
  bypassCSP: true
}

const MAIN_PAGE = join(__dirname, 'index.html')

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

protocol.registerSchemesAsPrivileged([
  { scheme: 'hyper', privileges: P2P_PRIVILEDGES },
  { scheme: 'dat', privileges: P2P_PRIVILEDGES }
])

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
  await setupProtocol()
  const urls = process.argv.filter((arg) => arg.includes('://'))
  if (urls.length) urls.map(createWindow)
  else createWindow()
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

async function setupProtocol () {
  app.setAsDefaultProtocolClient('hyper')
  app.setAsDefaultProtocolClient('dat')

  const hyperProtocolHandler = await createHyperHandler()
  protocol.registerStreamProtocol('hyper', hyperProtocolHandler)

  const browserProtocolHandler = await createBrowserHandler()
  protocol.registerStreamProtocol('agregore-browser', browserProtocolHandler)

  const datProtocolHandler = await createDatHandler()
  protocol.registerStreamProtocol('dat', datProtocolHandler)

/*
  app.setAsDefaultProtocolClient('ipfs')
  const ipfsProtocolHandler = await createIPFSHandler()
  protocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)

  */
}
