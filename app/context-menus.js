const electron = require('electron')
const Menu = electron.Menu || electron.remote.Menu
const MenuItem = electron.MenuItem || electron.remote.MenuItem

exports.headerContextMenu = function (event, params) {
  if (params.inputFieldType === 'plainText') {
    showContextMenu(this, [
      historyBufferGroup(params, false),
      editGroup(params, true)
    ])
  }
}

exports.pageContextMenu = function (event, params) {
  showContextMenu(this, [
    navigationGroup(this.webContents, params),
    historyBufferGroup(params),
    editGroup(params),
    developmentGroup(this.webContents, params)
  ])
}

function showContextMenu (browserWindow, groups) {
  const menu = new Menu()
  groups
    .filter(group => group != null)
    .flatMap((group, index, array) => {
      console.debug(group)
      if (index + 1 < array.length) {
        const seperator = new MenuItem({ type: 'separator' })
        group.push(seperator)
      }
      return group
    })
    .forEach(item => menu.append(item))
  menu.popup(browserWindow)
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
      accelerator: 'Alt+Left',
      click: wc.goBack
    }),
    new MenuItem({
      label: 'Forward',
      enabled: wc.canGoForward(),
      accelerator: 'Alt+Right',
      click: wc.goForward
    }),
    new MenuItem({
      label: 'Reload',
      accelerator: 'CommandOrControl+R',
      click: wc.reload
    }),
    new MenuItem({
      label: 'Hard Reload',
      accelerator: 'CommandOrControl+Shift+R',
      click: wc.reloadIgnoringCache
    })
  ]
}

function developmentGroup (wc, { x, y }) {
  return [
    new MenuItem({
      label: 'Inspect',
      click() {
        wc.inspectElement(x, y)
        if (wc.isDevToolsOpened()) wc.devToolsWebContents.focus()
      }
    })
  ]
}
