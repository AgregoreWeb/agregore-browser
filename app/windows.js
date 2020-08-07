const { app } = require('electron')
const { BrowserWindow } = require('electron')
const { resolve } = require('path')
const { headerContextMenu } = require('./ui/context-menus')
const fs = require('fs-extra')
const path = require('path')

const MAIN_PAGE = resolve(__dirname, './ui/index.html')
const PERSIST_FILE = path.join(app.getPath('userData'), 'lastOpened.json')
const LOGO_FILE = path.join(__dirname, '../build/icon.png')

module.exports = {
  createWindow,
  loadFromHistory,
  saveOpen
}

const openWindows = new Set()

function createWindow (url, options = {}) {
  // Create the browser window.
  const win = new BrowserWindow({
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: false
    },
    icon: LOGO_FILE,
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

  openWindows.add(win)

  win.once('closed', () => {
    openWindows.delete(win)
  })
}

function saveOpen (file = PERSIST_FILE) {
  const urls = getToSave()

  fs.outputJsonSync(file, urls)
}

function getToSave () {
  const currentlyOpen = [...openWindows]

  const urls = currentlyOpen.map((win) => {
    const view = win.getBrowserView() || win
    return view.webContents.getURL()
  })

  if (urls.length === 1) return []
  return urls
}

async function loadFromHistory (file = PERSIST_FILE) {
  const urls = await getHistory(file)

  for (const url of urls) {
    createWindow(url)
  }

  return urls
}

async function getHistory (file = PERSIST_FILE) {
  try {
    const urls = await fs.readJson(file)
    return urls
  } catch (e) {
    console.error(e.stack)
    return []
  }
}
