const { app, shell, dialog } = require('electron')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { join } = path

const { accelerators, extensions } = require('./config')

const FOCUS_URL_BAR_SCRIPT = `
document.getElementById('search').focus()
`

const OPEN_FIND_BAR_SCRIPT = `
document.getElementById('find').show()
`

const DEFAULT_CONFIG_FILE_NAME = '.agregorerc'

// For desktop shortcuts
const createDesktopShortcut = require('create-desktop-shortcuts')

const faviconFinder = require('favicon')
const webPConverter = require('webp-converter')
const svgToPng = require('svg-to-png')
const pngToIco = require('png-to-ico')
const sharp = require('sharp')
// Kyran: I don't like the number of packages we're using just to make shortcuts

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

      const shortcutName = webContents.getTitle().replace(/[\/|\\:*?"<>| ]/g, '') // Kyran: Normalise into possible file name, maybe we can do this nicer. We get rid of spaces because FS issues.

      const shortcut = {
        filePath: appPath,
        outputPath: outputPath,
        name: shortcutName,
        comment: 'Agregore Browser',
        arguments: webContents.getURL()
      }

      createShortcut = icon => {
        if(icon) shortcut.icon = icon
        // TODO: Kyran: Use Agregore icon if no icon provided.
        // TODO: Kyran: OSX doesn't have arguments option. See https://github.com/RangerMauve/agregore-browser/pull/53#issuecomment-705654060 for solution.
        createDesktopShortcut({
          windows: shortcut,
          linux: shortcut
        })
      }

      let faviconURL
      try {
        faviconURL = await webContents.executeJavaScript('document.querySelector("link[rel*=\'icon\']").href')
      } catch (error) {console.error(error)}
      try {
        if (!faviconURL) throw 'No favicon'
        webContents.session.on('will-download', (event, item, webContents) => {
          if (item.getURL() === faviconURL) {
            const savePath = path.join(app.getPath('userData'), 'PWAs', shortcutName, '/')
            const savePathNamed = savePath + 'favicon'
            const savePathDownload = savePathNamed + item.getFilename().replace(/.*(\.[a-z]*)/i, '$1')

            item.setSavePath(savePathDownload)
            item.once('done', async () => {
              try {
                try {
                  await sharp(savePathDownload).png().resize(256, 256).toFile(savePathNamed + '.png')
                } catch {
                  await webPConverter.cwebp(savePathDownload, savePathNamed + '.webp') // TODO: Kyran: Delete when done
                  await webPConverter.dwebp(savePathNamed + '.webp', savePathNamed + '.png', '-o') // TODO: Kyran: Delete when done if Windows
                }
                const iconType = (process.platform === 'win32') ? '.ico' : '.png'
                if (iconType === '.ico') {
                  const buffer = await pngToIco(savePathNamed + '.png')
                  fs.writeFileSync(savePathNamed + '.ico', buffer)
                }
                createShortcut(savePathNamed + iconType)
              } catch (error) {
                console.log(error)
                createShortcut()
              }
            })
          }
        })
        webContents.downloadURL(faviconURL)
      } catch (error) {
        console.log(error)
        createShortcut()
      }
    }
  }
}
