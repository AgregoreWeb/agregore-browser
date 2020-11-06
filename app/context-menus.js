const {
  Menu,
  MenuItem,
  dialog,
  app,
  clipboard
} = require('electron')

const path = require('path')
const pathPosix = path.posix

// For desktop shortcuts
const createDesktopShortcut = require('create-desktop-shortcuts')

const faviconFinder = require('favicon')
const webPConverter = require('webp-converter')
const svgToPng = require('svg-to-png')
const pngToIco = require('png-to-ico')
const fs = require('fs')
const sharp = require('sharp')
// Kyran: I don't like the number of packages we're using just to make shortcuts

module.exports = {
  attachContextMenus
}

function attachContextMenus ({ window, createWindow }) {
  if (window.web) {
    window.webContents.on('context-menu', headerContextMenu)
    window.web.on('context-menu', pageContextMenu)
  } else {
    window.webContents.on('context-menu', rawWindowContextMenu)
  }

  function rawWindowContextMenu (event, params) {
    showContextMenu([
      navigationGroup(window.web || window.webContents, params),
      historyBufferGroup(params),
      linkGroup(params),
      editGroup(params),
      developmentGroup(window.web || window.webContents, params)
    ])
  }

  function headerContextMenu (event, params) {
    if (params.inputFieldType === 'plainText') {
      showContextMenu([
        historyBufferGroup(params, false),
        editGroup(params, true)
      ])
    }
  }

  function pageContextMenu (event, params) {
    showContextMenu([
      navigationGroup(window.web || window.webContents, params),
      historyBufferGroup(params),
      linkGroup(params),
      saveGroup(params),
      editGroup(params),
      pageGroup(window.web || window.webContents),
      developmentGroup(window.web || window.webContents, params)
    ])
  }

  function showContextMenu (groups) {
    const menu = new Menu()
    groups
      .filter(group => group != null)
      .flatMap((group, index, array) => {
        if (index + 1 < array.length) {
          const seperator = new MenuItem({ type: 'separator' })
          group.push(seperator)
        }
        return group
      })
      .forEach(item => menu.append(item))
    menu.popup(window.window)
  }

  function historyBufferGroup ({ editFlags, isEditable }, showRedo = true) {
    return !isEditable ? null : [
      new MenuItem({
        label: 'Undo',
        enabled: editFlags.canUndo,
        accelerator: 'CommandOrControl+Z',
        role: 'undo'
      }),
      new MenuItem({
        label: 'Redo',
        enabled: editFlags.canRedo,
        visible: showRedo,
        accelerator: 'CommandOrControl+Y',
        role: 'redo'
      })
    ]
  }

  function editGroup ({ editFlags, isEditable, selectionText }) {
    return !isEditable && !selectionText ? null : [
      new MenuItem({
        label: 'Cut',
        enabled: editFlags.canCut,
        accelerator: 'CommandOrControl+X',
        role: 'cut'
      }),
      new MenuItem({
        label: 'Copy',
        enabled: editFlags.canCopy,
        accelerator: 'CommandOrControl+C',
        role: 'copy'
      }),
      new MenuItem({
        label: 'Paste',
        enabled: editFlags.canPaste,
        accelerator: 'CommandOrControl+P',
        role: 'paste'
      }),
      new MenuItem({
        label: 'Delete',
        enabled: editFlags.canDelete,
        role: 'delete'
      }),
      new MenuItem({
        type: 'separator'
      }),
      new MenuItem({
        label: 'Select All',
        enabled: editFlags.canSelectAll,
        accelerator: 'CommandOrControl+A',
        role: 'selectAll'
      })
    ]
  }

  function navigationGroup (wc, { mediaType, isEditable }) {
    return mediaType !== 'none' || isEditable ? null : [
      new MenuItem({
        label: 'Back',
        enabled: wc.canGoBack(),
        click: wc.goBack
      }),
      new MenuItem({
        label: 'Forward',
        enabled: wc.canGoForward(),
        click: wc.goForward
      }),
      new MenuItem({
        label: 'Reload',
        click: wc.reload
      }),
      new MenuItem({
        label: 'Hard Reload',
        click: wc.reloadIgnoringCache
      })
    ]
  }

  function pageGroup (wc) {
    return [
      new MenuItem({
        label: 'Create shortcut',
        click: async () => {
          const outputPath = (await dialog.showOpenDialog({
            properties: ['openDirectory']
          })).filePaths[0]
          const appPath = process.argv[0]

          const shortcutName = wc.getTitle().replace(/[\/|\\:*?"<>| ]/g, '') // Kyran: Normalise into possible file name, maybe we can do this nicer. We get rid of spaces because FS issues.

          const shortcut = {
            filePath: appPath,
            outputPath: outputPath,
            name: shortcutName,
            comment: 'Agregore Browser',
            arguments: wc.getURL()
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
            faviconURL = await wc.executeJavaScript('document.querySelector("link[rel*=\'icon\']").href')
          } catch {}
          try {
            if (!faviconURL) throw 'No favicon'
            wc.session.on('will-download', (event, item, webContents) => {
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
            wc.downloadURL(faviconURL)
          } catch (error) {
            console.log(error)
            createShortcut()
          }
        }
      })
    ]
  }

  function developmentGroup (wc, { x, y }) {
    return [
      new MenuItem({
        label: 'Inspect',
        click () {
          wc.inspectElement(x, y)
          if (wc.isDevToolsOpened()) wc.devToolsWebContents.focus()
        }
      })
    ]
  }

  function linkGroup ({ linkURL }) {
    return !linkURL.length ? null : [
      new MenuItem({
        label: 'Open link in new window',
        click: () => createWindow(linkURL)
      }),
      new MenuItem({
        label: 'Copy link address',
        click: () => clipboard.writeText(linkURL)
      })
    ]
  }

  function saveGroup ({ srcURL }) {
    return !srcURL.length ? null : [
      new MenuItem({
        label: 'Save As',
        click: (_, browserWindow) => saveAs(srcURL, browserWindow)
      })
    ]
  }

  async function saveAs (link, browserWindow) {
    const downloads = app.getPath('downloads')
    const name = pathPosix.basename(link)
    const defaultPath = pathPosix.join(downloads, name)
    const { filePath } = await dialog.showSaveDialog(browserWindow, {
      defaultPath
    })

    if (!filePath) return

    await window.webContents.executeJavaScript(`
  (async () => {
  const fs = require('fs')
  const pump = require('pump')
  const { Readable } = require('stream')
  const link = ${JSON.stringify(link)}
  const filePath = ${JSON.stringify(filePath)}

  const response = await window.fetch(link)

  pump(
    Readable.from(consumeBody(response.body)),
    fs.createWriteStream(filePath)
  )

  async function * consumeBody (body) {
    const reader = body.getReader()

    try {
      const { done, value } = await reader.read()

      if (done) return

      yield value
    } finally {
      reader.releaseLock()
    }
  }
  })()
  `)
  }
}
