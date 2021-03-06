
const { app } = require('electron')
const path = require('path')

const USER_DATA = app.getPath('userData')
const DEFAULT_EXTENSIONS_DIR = path.join(USER_DATA, 'extensions')
const DEFAULT_IPFS_DIR = path.join(USER_DATA, 'ipfs')
const DEFAULT_HYPER_DIR = path.join(USER_DATA, 'hyper')
const DEFAULT_DAT_DIR = path.join(USER_DATA, 'dat')
const DEFAULT_BT_DIR = path.join(USER_DATA, 'bt')

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
    EditConfigFile: 'CommandOrControl+.',
    CreateBookmark: 'CommandOrControl+D'
  },
  extensions: {
    dir: DEFAULT_EXTENSIONS_DIR,
    // TODO: This will be for loading extensions from remote URLs
    remote: []
  },
  theme: {
    'font-family': 'system-ui',
    background: 'var(--ag-color-black)',
    text: 'var(--ag-color-white)',
    primary: 'var(--ag-color-purple)',
    secondary: 'var(--ag-color-green)',
    indent: '16px',
    'max-width': '666px'
  },
  // All options here: https://github.com/ipfs/js-ipfs/blob/master/docs/CONFIG.md
  ipfsOptions: {
    repo: DEFAULT_IPFS_DIR,
    silent: true
  },
  // All options here: https://github.com/datproject/sdk/#const-hypercore-hyperdrive-resolvename-keypair-derivesecret-registerextension-close--await-sdkopts
  hyperOptions: {
    storageLocation: DEFAULT_HYPER_DIR
  },
  datOptions: {
    storageLocation: DEFAULT_DAT_DIR
  },
  // All options here: https://github.com/webtorrent/webtorrent/blob/master/docs/api.md
  btOptions: {
    storageLocation: DEFAULT_BT_DIR
  }
})
