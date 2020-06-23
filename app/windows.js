const { BrowserWindow } = require('electron')
const { resolve } = require('path')
const { headerContextMenu } = require('./ui/context-menus')

const MAIN_PAGE = resolve(__dirname, './ui/index.html')

module.exports = {
  createWindow
}

function createWindow (url, options = {}) {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    },
    show: false,
    ...options
  })

  const toLoad = new URL(MAIN_PAGE, 'file:')

  if (url) toLoad.searchParams.set('url', url)

  // and load the index.html of the app.
  win.loadURL(toLoad.href)

  win.once('ready-to-show', () => win.show())

  win.webContents.on('context-menu', headerContextMenu.bind(win))

  // Open the DevTools.
  if (process.env.MODE === 'debug') {
    win.webContents.openDevTools()
  }
}
