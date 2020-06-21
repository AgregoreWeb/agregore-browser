const { app, BrowserWindow } = require('electron')

const protocols = require('./protocols')
const { registerMenu } = require('./menu')
const { createWindow } = require('./windows')

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

async function onready () {
  await protocols.setupProtocols()
  await registerMenu()
  const urls = process.argv.filter((arg) => arg.includes('://'))
  if (urls.length) urls.map(createWindow)
  else createWindow()
}
