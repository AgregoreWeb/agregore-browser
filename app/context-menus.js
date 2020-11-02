const {
  Menu,
  MenuItem,
  dialog,
  app,
  clipboard
} = require('electron')

const path = require('path').posix

const createDesktopShortcut = require('create-desktop-shortcuts')

const faviconFinder = require('favicon')
const webPConverter = require('webp-converter')
const pngToIco = require('png-to-ico')
const fs = require('fs')
// Kyran: Surely needing both of these is overkill... Can't find a better way though.

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
          console.log(outputPath)
          const appPath = process.argv[0]

          const URL = wc.getURL()

          const shortcutName = wc.getTitle().replace(/[\/|\\:*?"<>| ]/g, '') // Kyran: Normalise into possible file name, maybe we can do this nicer. We get rid of spaces because FS issues.

          const shortcut = {
            filePath: appPath,
            outputPath: outputPath,
            name: shortcutName,
            comment: 'Agregore Browser',
            arguments: URL
          }

          createShortcut = icon => {
            shortcut.icon = icon
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
                // Kyran: !!! path.join is broken it keeps outputting using / on Windows; not sure why.
                const slash = (process.platform === 'win32') ? '\\' : '/'
                const savePath = `${app.getPath('userData')}${slash}PWAs${slash}${shortcutName}${slash}` // TODO: Kyran: Join with path.join
                const savePathNamed = savePath + 'favicon'
                const savePathDownload = savePath + item.getFilename()

                item.setSavePath(savePathDownload)
                item.once('done', async () => {
                  try {
                    // TODO: SVGs aren't working
                    await webPConverter.cwebp(savePathDownload, savePathNamed + '.webp') // TODO: Kyran: Delete when done
                    await webPConverter.dwebp(savePathNamed + '.webp', savePathNamed + '.png', '-o') // TODO: Kyran: Delete when done if Windows
                    const buffer = await pngToIco(savePathNamed + '.png') // TODO: Kyran: Don't do if not Windows
                    fs.writeFileSync(savePathNamed + '.ico', buffer)
                    createShortcut(savePathNamed + (process.platform === 'win32' ? '.ico' : '.png'))
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
    const name = path.basename(link)
    const defaultPath = path.join(downloads, name)
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
