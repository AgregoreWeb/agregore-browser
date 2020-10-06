
const { app } = require('electron')
const path = require('path')

const DEFAULT_EXTENSIONS_DIR = path.join(app.getPath('userData'), 'extensions')

module.exports = require('rc')('agregore', {
  accelerators: {
    OpenDevTools: 'CommandOrControl+Shift+I',
    NewWindow: 'CommandOrControl+N',
    Forward: 'CommandOrControl+]',
    Back: 'CommandOrControl+[',
    FocusURLBar: 'CommandOrControl+L',
    FindInPage: 'CommandOrControl+F',
    Reload: 'CommandOrControl+R',
    HardReload: 'CommandOrControl+Shift+R',
    LearnMore: null,
    OpenExtensionsFolder: null,
    EditConfigFile: 'CommandOrControl+.'
  },
  extensions: {
    dir: DEFAULT_EXTENSIONS_DIR,
    // TODO: This will be for loading extensions from remote URLs
    remote: []
  },
  theme: {
    'font-family': 'system-ui', // Default system-ui
    background: 'var(--ag-color-black)', // Default var(--ag-color-black)
    text: 'var(--ag-color-white)', // Default var(--ag-color-white)
    primary: 'var(--ag-color-purple)', // Default var(--ag-color-purple)
    secondary: 'var(--ag-color-green)', // Default var(--ag-color-green)
    indent: '16px', // Default 16px
    'max-width': '666px' // Default 666px
  }
})
