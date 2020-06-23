const { Menu, MenuItem } = require('electron')

const {createWindow} = require('./windows')

module.exports = {
  registerMenu
}

function registerMenu () {
  const openDevTools = new MenuItem({
    label: 'Toggle Developer Tools For Frame',
    click: onOpenDevTools,
    accelerator: 'CommandOrControl+Shift+I'
  })

  function onOpenDevTools (event, focusedWindow, focusedWebContents) {
  	const views = focusedWindow.getBrowserViews()
    for (const { webContents } of views) {
      webContents.openDevTools()
    }

    if(!views.length) focusedWindow.openDevTools()
  }

  const openNewWindow = new MenuItem({
		label: 'New Window',
		click: onNewWindow,
		accelerator: 'CommandOrControl+N'
  })

  function onNewWindow (event, focusedWindow, focusedWebContents) {
		createWindow()
  }

  const menu = Menu.getApplicationMenu()

  const viewMenu = menu.items[2]

  const existingDevtools = viewMenu.submenu.items[2]

  existingDevtools.registerAccelerator = false

  viewMenu.submenu.insert(3, openDevTools)

  const windowMenu = menu.items[3]

  windowMenu.submenu.insert(0, openNewWindow)
}
