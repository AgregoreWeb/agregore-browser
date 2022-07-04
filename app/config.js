const { app } = require('electron')
const path = require('path')

const USER_DATA = app.getPath('userData')
const DEFAULT_EXTENSIONS_DIR = path.join(USER_DATA, 'extensions')
const DEFAULT_IPFS_DIR = path.join(USER_DATA, 'ipfs')
const DEFAULT_HYPER_DIR = path.join(USER_DATA, 'hyper')
const DEFAULT_SSB_APPNAME = 'agregore-ssb'
const DEFAULT_BT_DIR = path.join(USER_DATA, 'bt')
const DEFAULT_GUN_DIR = path.join(USER_DATA, 'gun')

const DEFAULT_PAGE = 'agregore://welcome'

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

  defaultPage: DEFAULT_PAGE,
  autoHideMenuBar: false,

  // All options here: https://github.com/ipfs/js-ipfs/blob/master/docs/CONFIG.md
  ipfsOptions: {
    repo: DEFAULT_IPFS_DIR,
    silent: true,
    preload: {
      enabled: false
    }
  },
  // All options here: https://github.com/datproject/sdk/#const-hypercore-hyperdrive-resolvename-keypair-derivesecret-registerextension-close--await-sdkopts
  hyperOptions: {
    storage: DEFAULT_HYPER_DIR
  },
  /**
   * All ssb options here: https://github.com/ssbc/ssb-config#configuration
   * For bundled ssb server we use ssbd. Pass in an array of require'd ssb plugins
   */
  ssbOptions: {
    appname: DEFAULT_SSB_APPNAME,
    ssbd: {
      runServer: true,
      plugins: require('@metacentre/shipyard-ssb')
    }
  },
  // All options here: https://github.com/webtorrent/webtorrent/blob/master/docs/api.md
  btOptions: {
    storageLocation: DEFAULT_BT_DIR
  },
  // All options here: https://gun.eco/docs/API#-a-name-gun-a-gun-options-
  gunOptions: {
    file: DEFAULT_GUN_DIR,
    radisk: true,
    relay: false
  }
})
