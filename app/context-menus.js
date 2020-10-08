const {
  Menu,
  MenuItem,
  dialog,
  app,
  clipboard
} = require('electron')
const createDesktopShortcut = require('create-desktop-shortcuts');

const path = require('path').posix

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
      pageGroup(window.web || window.webContents),
      historyBufferGroup(params),
      linkGroup(params),
      saveGroup(params),
      editGroup(params),
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
          let outputPath = (await dialog.showOpenDialog({
              properties: ['openDirectory']
          })).filePaths[0]
          console.log(outputPath);
          let appPath = app.getAppPath();
          appPath = 'C:\\Users\\kyran.SYRIS\\AppData\\Local\\Programs\\agregore-browser\\' //testing (will try to get source executable if not used (doesn't exist))
          appPath += 'Agregore Browser.exe'

          let URL = wc.getURL();

          var windows = {}, linux; // Kyran: OSX doesn't have arguments option, this is pointless there... Not sure what to do for them.
          shortcutOptions = [windows, linux]; 
          windows.filePath = appPath;
          windows.outputPath = outputPath;
          windows.name = wc.getTitle().replace(/[\/|\\:*?"<>]/g, " ").replace("  ", " "); // Kyran: Normalise into possible file name
          windows.arguments = URL;
          let faviconURL;
          try {
            faviconURL = await wc.executeJavaScript(`document.querySelector("link[rel*='icon']").href`);
          } catch {}
          if(faviconURL != undefined) {
            wc.session.on('will-download', (event, item, webContents) => {
              if(item.getURL() === faviconURL) {
                let savePath = outputPath + '\\' + item.getFilename();
                item.setSavePath(savePath);
                windows.icon = savePath;
                console.log(windows);
                item.once('done', () =>
                  createDesktopShortcut({
                    windows: windows,
                    linux: linux
                  })
                );
              }
            })
            wc.downloadURL(faviconURL);
          } else createDesktopShortcut({
            windows: windows,
            linux: linux
          });

          

          if (shortcutsCreated) {
            console.log('Everything worked correctly!');
          } else {
            console.log('Could not create the icon or set its permissions (in Linux if "chmod" is set to true, or not set)');
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
