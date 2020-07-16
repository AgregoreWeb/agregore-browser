const { Menu, app } = require('electron')

const { createWindow } = require('./windows')

const isMac = process.platform === 'darwin'

const FOCUS_URL_BAR_SCRIPT = `
document.getElementById('search').focus()
`

module.exports = {
  registerMenu
}

function registerMenu () {
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' },
        { label: 'Open Dev Tools', accelerator: 'CommandOrControl+Shift+I', click: onOpenDevTools },
        {
          label: 'New Window',
          click: onNewWindow,
          accelerator: 'CommandOrControl+N'
        }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { label: 'Forward', accelerator: 'CommandOrControl+]', click: onGoForward },
        { label: 'Back', accelerator: 'CommandOrControl+[', click: onGoBack },
        {
          label: 'Focus URL Bar',
          click: onFocusURlBar,
          accelerator: 'CommandOrControl+L'
        },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { label: 'Reload', accelerator: 'CommandOrControl+R', click: onReload },
        { label: 'Hard Reload', accelerator: 'CommandOrControl+Shift+R', click: onHardReload },
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://github.com/RangerMauve/agregore-browser')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

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
}
