const { app, shell, dialog } = require('electron')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { join } = path
const createDesktopShortcut = require('create-desktop-shortcuts')
const dataUriToBuffer = require('data-uri-to-buffer')
const sanitize = require('sanitize-filename')

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
      label: 'Edit Configuration File',
      accelerator: accelerators.EditConfigFile,
      click: onEditConfigFile
    },
    CreateBookmark: {
      label: 'Create Bookmark',
      accelerator: accelerators.CreateBookmark,
      click: onCreateBookmark
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

  async function onCreateBookmark (event, focusedWindow) {
    for (const webContents of getContents(focusedWindow)) {
      const outputPath = (await dialog.showOpenDialog({
        properties: ['openDirectory']
      })).filePaths[0]

      const appPath = process.argv[0]

      const title = webContents.getTitle()
      const shortcutName = sanitize(title, { replacement: ' ' })
      const url = webContents.getURL()

      const shortcut = {
        filePath: appPath,
        outputPath: outputPath,
        name: shortcutName,
        comment: `Agregore Browser - ${url}`,
        arguments: [url]
      }

      const createShortcut = icon => {
        if (icon) shortcut.icon = icon
        // TODO: Kyran: Use Agregore icon if no icon provided.
        // TODO: Kyran: OSX doesn't have arguments option. See https://github.com/RangerMauve/agregore-browser/pull/53#issuecomment-705654060 for solution.
        createDesktopShortcut({
          windows: shortcut,
          linux: shortcut
        })
      }

      try {
        const faviconDataURI = await getFaviconDataURL(webContents)
        const buffer = dataUriToBuffer(faviconDataURI)

        const savePath = path.join(app.getPath('userData'), 'PWAs', shortcutName)
        const faviconPath = path.join(savePath, 'favicon.png')

        await fs.ensureDir(savePath)
        await fs.writeFile(faviconPath, buffer)

        createShortcut(faviconPath)
      } catch (e) {
        console.error('Error loading favicon')
        console.error(e.stack)
        createShortcut()
      }
    }
  }
}

async function getFaviconDataURL (webContents) {
  return webContents.executeJavaScript(`
    (async () => {
    const link = document.querySelector('link[rel*=\\'icon\\']')
    const {href} = link
    const image = new Image()

    await new Promise((resolve) => {
       image.onload = resolve
       image.src = href
    })

    const canvas = document.createElement('canvas')

    canvas.width = 256
    canvas.height = 256

    const context = canvas.getContext('2d')

    context.drawImage(image, 0,0, 256, 256)

    return canvas.toDataURL('image/png')
    })()
  `)
}
