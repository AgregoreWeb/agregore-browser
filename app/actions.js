import { app, shell, dialog } from 'electron'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import createDesktopShortcut from 'create-desktop-shortcuts'
import dataUriToBuffer from 'data-uri-to-buffer'
import sanitize from 'sanitize-filename'

import Config from './config.js'
const { accelerators, extensions, appPath } = Config
const { join } = path

const FOCUS_URL_BAR_SCRIPT = `
document.getElementById('search').showInput()
document.getElementById('search').focus()
`

const OPEN_FIND_BAR_SCRIPT = `
document.getElementById('find').show()
`

const DEFAULT_CONFIG_FILE_NAME = '.agregorerc'

export function createActions ({
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
    SetAsDefaultMagnet: {
      label: 'Set as Default for Torrents',
      accelerator: accelerators.SetAsDefaultMagnet,
      click: onSetAsDefaultMagnet
    },
    OpenExtensionFolder: {
      label: 'Open Extensions Folder',
      accelerator: accelerators.OpenExtensionFolder,
      click: onOpenExtensionFolder
    },
    OpenDataFolder: {
      label: 'Open Data Folder',
      accelerator: accelerators.OpenDataFolder,
      click: onOpenDataFolder
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

  async function onSetAsDefaultMagnet () {
    app.setAsDefaultProtocolClient('magnet')
  }

  async function onLearMore () {
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
    try {
      const { dir } = extensions
      await fs.ensureDir(dir)

      await shell.openPath(dir)
    } catch (e) {
      console.error(e.stack)
    }
  }

  async function onOpenDataFolder () {
    try {
      await shell.openPath(app.getPath('userData'))
    } catch (e) {
      console.error(e.stack)
    }
  }

  async function onEditConfigFile () {
    const file = join(os.homedir(), DEFAULT_CONFIG_FILE_NAME)

    const exists = await fs.pathExists(file)

    if (!exists) await fs.writeJson(file, {})

    await shell.openPath(file)
  }

  async function onCreateBookmark (event, focusedWindow) {
    for (const webContents of getContents(focusedWindow)) {
      const defaultPath = app.getPath('desktop')
      const outputPath = (await dialog.showOpenDialog({
        defaultPath,
        properties: ['openDirectory']
      })).filePaths[0]

      // If testing from source find and use installed Agregore location
      const filePath = appPath || process.argv[0]

      const title = webContents.getTitle()
      const shortcutName = sanitize(title, { replacement: ' ' })
      const url = webContents.getURL()
      const description = `Agregore Browser - ${url}`

      const shortcut = {
        filePath,
        outputPath,
        name: shortcutName,
        comment: description,
        description,
        arguments: url
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
        const type = process.platform === 'win32' ? 'ico' : 'png'
        const faviconDataURI = await getFaviconDataURL(webContents, type)
        const buffer = dataUriToBuffer(faviconDataURI)

        const savePath = path.join(app.getPath('userData'), 'PWAs', shortcutName)
        const faviconPath = path.join(savePath, `favicon.${type}`)

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

async function getFaviconDataURL (webContents, type) {
  return webContents.executeJavaScript(`new Promise(async (resolve, reject) => {
    try {
    const {href} = document.querySelector("link[rel*='icon']")

    const image = new Image()
      await new Promise(resolve => {
         image.onload = resolve
         image.src = href
      })

    const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256

    const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0, 256, 256)

    ${
      type === 'ico'
      ? `
        canvas.toBlob(blob => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(new Blob([].concat([
            [0, 0],      // ICO header
            [1, 0],      // Is ICO
            [1, 0],      // Number of images
            [0],         // Width (0 seems to work)
            [0],         // Height (0 seems to work)
            [0],         // Color palette (none)
            [0],         // Reserved space
            [1, 0],      // Color planes
            [32, 0],     // Bit depth
          ].map(part => new Uint8Array(part).buffer), [
            [blob.size], // Image byte size
            [22],        // Image byte offset
          ].map(part => new Uint32Array(part).buffer), [
            blob,        // Image
          ]), {type: 'image/vnd.microsoft.icon'}))
        })`

      : "resolve(canvas.toDataURL('image/png'))"
    }
    } catch (e) {
      reject(e)
    }
  })`)
}
//
