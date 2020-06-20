const { Menu } = require('electron')

exports.headerContextMenu = function (event, params) {
  if (params.inputFieldType !== "plainText") return
  const menu = Menu.buildFromTemplate([
  {
    label: 'Undo',
    enabled: params.editFlags.canUndo,
    visible: params.isEditable,
    accelerator: 'CommandOrControl+Z',
    role: 'undo'
  },
  {
    type: 'separator'
  },
  {
    label: 'Cut',
    enabled: params.editFlags.canCut,
    visible: params.isEditable,
    accelerator: 'CommandOrControl+X',
    role: 'cut'
  },
  {
    label: 'Copy',
    enabled: params.editFlags.canCopy,
    visible: params.isEditable || params.selectionText.trim().length > 0,
    accelerator: 'CommandOrControl+C',
    role: 'copy'
  },
  {
    label: 'Paste',
    enabled: params.editFlags.canPaste,
    visible: params.isEditable,
    accelerator: 'CommandOrControl+P',
    role: 'paste'
  },
  {
    label: 'Delete',
    enabled: params.editFlags.canDelete,
    visible: params.isEditable,
    role: 'delete'
  },
  {
    type: 'separator'
  },
  {
    label: 'Select All',
    enabled: params.isEditable || params.selectionText.trim().length > 0,
    accelerator: 'CommandOrControl+A',
    role: 'selectAll'
  }
  ])
  menu.popup(this)
}
