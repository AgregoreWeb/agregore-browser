import { app } from 'electron'
import path from 'path'
import RC from 'rc'

const USER_DATA = app.getPath('userData')
const DEFAULT_EXTENSIONS_DIR = path.join(USER_DATA, 'extensions')
const DEFAULT_IPFS_DIR = path.join(USER_DATA, 'ipfs')
const DEFAULT_HYPER_DIR = path.join(USER_DATA, 'hyper')
// const DEFAULT_SSB_DIR = path.join(USER_DATA, 'ssb')
const DEFAULT_BT_DIR = path.join(USER_DATA, 'bt')

const DEFAULT_PAGE = 'agregore://welcome'

export default RC('agregore', {
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
    },
    config: {
      Ipns: {
        UsePubsub: true
      },
      Pubsub: {
        Enabled: true
      },
      Addresses: {
        API: '/ip4/127.0.0.1/tcp/2473',
        Gateway: '/ip4/127.0.0.1/tcp/2474',
        Swarm: [
          '/ip4/0.0.0.0/tcp/2475',
          '/ip6/::/tcp/2475',
          '/ip4/0.0.0.0/udp/2475/quic',
          '/ip6/::/udp/2475/quic'
        ]
      },
      // We don't need a gateway running. 🤷
      Gateway: null
    }
  },

  // All options here: https://github.com/datproject/sdk/#const-hypercore-hyperdrive-resolvename-keypair-derivesecret-registerextension-close--await-sdkopts
  hyperOptions: {
    storage: DEFAULT_HYPER_DIR
  },

  // All options here: https://github.com/ssbc/ssb-config#configuration
  ssbOptions: {},

  // All options here: https://github.com/webtorrent/webtorrent/blob/master/docs/api.md
  btOptions: {
    folder: DEFAULT_BT_DIR
  }
})
