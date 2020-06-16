const { app, BrowserWindow, protocol } = require('electron')
const createHyperHandler = require('./hyper-protocol')
// const createIPFSHandler = require('./ipfs-protocol')
const createBrowserHandler = require('./browser-protocol')
const createDatHandler = require('./dat-protocol')

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Open the DevTools.
  win.webContents.openDevTools()
}

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
  createWindow()
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

async function setupProtocol () {
  app.setAsDefaultProtocolClient('hyper')
  const hyperProtocolHandler = await createHyperHandler()
  protocol.registerStreamProtocol('hyper', hyperProtocolHandler)

  const browserProtocolHandler = await createBrowserHandler()
  protocol.registerStreamProtocol('dweb-browser', browserProtocolHandler)

  const datProtocolHandler = await createDatHandler()
  protocol.registerStreamProtocol('dat', datProtocolHandler)

/*
  app.setAsDefaultProtocolClient('ipfs')
  const ipfsProtocolHandler = await createIPFSHandler()
  protocol.registerStreamProtocol('ipfs', ipfsProtocolHandler)

  */
}
