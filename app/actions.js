const { app, shell } = require('electron')
const fs = require('fs-extra')
const os = require('os')
const { join } = require('path')

const { accelerators, extensions } = require('./config')

const FOCUS_URL_BAR_SCRIPT = `
document.getElementById('search').focus()
`

const OPEN_FIND_BAR_SCRIPT = `
document.getElementById('find').show()
`

const DEFAULT_CONFIG_FILE_NAME = '.agregorerc'

module.exports = { createActions }

function createActions ({
  createWindow
}) {
  return {
    OpenDevTools: {
      label: 'Open Dev Tools',
      accelerator: accelerators.OpenDevTools,
      click: onOpenDevTools
    },
    NewWindow: {
      label: 'New Window',
      click: onNewWindow,
      accelerator: accelerators.NewWindow
    },
    Forward: {
      label: 'Forward',
      accelerator: accelerators.Forward,
      click: onGoForward
    },
    Back: {
      label: 'Back',
      accelerator: accelerators.Back,
      click: onGoBack
    },
    FocusURLBar: {
      label: 'Focus URL Bar',
      click: onFocusURlBar,
      accelerator: accelerators.FocusURLBar
    },
    FindInPage: {
      label: 'Find in Page',
      click: onFindInPage,
      accelerator: accelerators.FindInPage
    },
    Reload: {
      label: 'Reload',
      accelerator: accelerators.Reload,
      click: onReload
    },
    HardReload: {
      label: 'Hard Reload',
      accelerator: accelerators.HardReload,
      click: onHardReload
    },
    LearnMore: {
      label: 'Learn More',
      accelerator: accelerators.LearnMore,
      click: onLearMore
    },
    SetAsDefault: {
      label: 'Set as Default Browser',
      accelerator: accelerators.SetAsDefault,
      click: onSetAsDefault
    },
    OpenExtensionFolder: {
      label: 'Open Extensions Folder',
      accelerator: accelerators.OpenExtensionFolder,
      click: onOpenExtensionFolder
    },
    EditConfigFile: {
      label: 'Edit Coniguration File',
      accelerators: accelerators.EditConfigFile,
      click: onEditConfigFile
    }
  }
  async function onSetAsDefault () {
    app.setAsDefaultProtocolClient('http')
    app.setAsDefaultProtocolClient('https')
  }

  async function onLearMore () {
    const { shell } = require('electron')
    await shell.openExternal('https://github.com/RangerMauve/agregore-browser')
  }

  function onOpenDevTools (event, focusedWindow, focusedWebContents) {
    const contents = getContents(focusedWindow)
    for (const webContents of contents) {
      webContents.openDevTools()
    }
  }

  function onNewWindow (event, focusedWindow, focusedWebContents) {
    createWindow()
  }

  function onFocusURlBar (event, focusedWindow) {
    focusedWindow.webContents.focus()
    focusedWindow.webContents.executeJavaScript(FOCUS_URL_BAR_SCRIPT, true)
  }

  function onFindInPage (event, focusedWindow) {
    focusedWindow.webContents.focus()
    focusedWindow.webContents.executeJavaScript(OPEN_FIND_BAR_SCRIPT, true)
  }

  function onReload (event, focusedWindow, focusedWebContents) {
  // Reload
    for (const webContents of getContents(focusedWindow)) {
      webContents.reload()
    }
  }

  function onHardReload (event, focusedWindow, focusedWebContents) {
  // Hard reload
    for (const webContents of getContents(focusedWindow)) {
      webContents.reloadIgnoringCache()
    }
  }

  function onGoForward (event, focusedWindow) {
    for (const webContents of getContents(focusedWindow)) {
      webContents.goForward()
    }
  }

  function onGoBack (event, focusedWindow) {
    for (const webContents of getContents(focusedWindow)) {
      webContents.goBack()
    }
  }

  function getContents (focusedWindow) {
    const views = focusedWindow.getBrowserViews()
    if (!views.length) return [focusedWindow.webContents]
    return views.map(({ webContents }) => webContents)
  }

  async function onOpenExtensionFolder () {
    const { dir } = extensions
    await fs.ensureDir(dir)

    await shell.openPath(dir)
  }

  async function onEditConfigFile () {
    const file = join(os.homedir(), DEFAULT_CONFIG_FILE_NAME)

    const exists = await fs.pathExists(file)

    if (!exists) await fs.writeJson(file, {})

    await shell.openPath(file)
  }
}
