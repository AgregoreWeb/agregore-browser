import {
  Menu,
  MenuItem,
  clipboard
} from 'electron'

export function attachContextMenus ({ window, createWindow, extensions }) {
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
    // TODO: Context menus for browser actions
  }

  function pageContextMenu (event, params) {
    showContextMenu([
      navigationGroup(window.web || window.webContents, params),
      historyBufferGroup(params),
      linkGroup(params),
      saveGroup(params),
      editGroup(params),
      developmentGroup(window.web || window.webContents, params),
      extensionGroup(event, params)
    ])
  }

  function showContextMenu (groups) {
    const menu = new Menu()
    groups
      .filter(group => group != null)
      .flatMap((group, index, array) => {
        if (index + 1 < array.length) {
          const separator = new MenuItem({ type: 'separator' })
          group.push(separator)
        }
        return group
      })
      .forEach(item => menu.append(item))
    menu.popup(window.window)
  }

  function extensionGroup (event, params) {
    const webContents = window.web
    return extensions.listContextMenuForEvent(webContents, event, params)
  }

  function historyBufferGroup ({ editFlags, isEditable }, showRedo = true) {
    return !isEditable
      ? null
      : [
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
    return !isEditable && !selectionText
      ? null
      : [
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
    return mediaType !== 'none' || isEditable
      ? null
      : [
          new MenuItem({
            label: 'Back',
            enabled: wc.canGoBack(),
            click: () => wc.goBack()
          }),
          new MenuItem({
            label: 'Forward',
            enabled: wc.canGoForward(),
            click: () => wc.goForward()
          }),
          new MenuItem({
            label: 'Reload',
            click: () => wc.reload()
          }),
          new MenuItem({
            label: 'Hard Reload',
            click: () => wc.reloadIgnoringCache()
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
    return !linkURL.length
      ? null
      : [
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
    return !srcURL.length
      ? null
      : [
          new MenuItem({
            label: 'Copy source address',
            click: () => clipboard.writeText(srcURL)
          }),
          new MenuItem({
            label: 'Save As',
            click: () => saveAs(srcURL)
          })
        ]
  }

  async function saveAs (link, browserWindow) {
    await window.web.downloadURL(link)
  }
}
