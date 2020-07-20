const electron = require('electron')
const { remote, clipboard } = electron
const { Menu, MenuItem } = remote || electron

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
    linkGroup(params),
    saveGroup(params),
    editGroup(params),
    developmentGroup(this.webContents, params)
  ])
}

function showContextMenu (browserWindow, groups) {
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
      click: () => remote.require('./windows').createWindow(linkURL)
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
  const fs = remote.require('fs')
  const path = remote.require('path').posix
  const pump = require('pump')
  const { dialog, app } = remote
  const { Readable } = require('stream')
  const downloads = app.getPath('downloads')

  const name = path.basename(link)

  const defaultPath = path.join(downloads, name)

  const response = await window.fetch(link)

  const { filePath } = await dialog.showSaveDialog(browserWindow, {
    defaultPath
  })

  if (!filePath) return

  pump(
    Readable.from(consumeBody(response.body)),
    fs.createWriteStream(filePath)
  )
}

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
