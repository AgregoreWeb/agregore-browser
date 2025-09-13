import { app, ipcMain, nativeTheme } from 'electron'
import RC from 'rc'

import os from 'node:os'
import path from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { getDefaultChainList } from 'web3protocol/chains'
const { join } = path

const __dirname = fileURLToPath(new URL('./', import.meta.url))

const isWindows = process.platform === 'win32'
const isMac = process.platform === 'darwin'

const USER_DATA = app.getPath('userData')
const DEFAULT_EXTENSIONS_DIR = path.join(USER_DATA, 'extensions')
const DEFAULT_IPFS_DIR = path.join(USER_DATA, 'ipfs')
const DEFAULT_HYPER_DIR = path.join(USER_DATA, 'hyper')
// const DEFAULT_SSB_DIR = path.join(USER_DATA, 'ssb')
const DEFAULT_BT_DIR = path.join(USER_DATA, 'bt')

const DEFAULT_PAGE = 'agregore://welcome'
const DEFAULT_SEARCH_PROVIDER = 'https://duckduckgo.com/?ia=web&q=%s'

const DEFAULT_CONFIG_FILE_NAME = '.agregorerc'
export const MAIN_RC_FILE = join(os.homedir(), DEFAULT_CONFIG_FILE_NAME)

let DEFAULT_BACKGROUND = 'var(--ag-color-black)'
let DEFAULT_TEXT = 'var(--ag-color-white)'
let DEFAULT_PAGE_THEME = 'var(--ag-color-black)'

const { shouldUseDarkColors } = nativeTheme

if (shouldUseDarkColors === false) {
  DEFAULT_BACKGROUND = 'var(--ag-color-white)'
  DEFAULT_TEXT = 'var(--ag-color-black)'
  DEFAULT_PAGE_THEME = 'var(--ag-color-white)'

  if (isMac) {
    DEFAULT_BACKGROUND = '#F5F5F7'
    DEFAULT_TEXT = '#1D1D1F'
  }
  if (isWindows) {
    DEFAULT_BACKGROUND = '#F3F3F3'
    DEFAULT_TEXT = '#1a1a1a'
  }
} else {
  if (isMac) {
    DEFAULT_BACKGROUND = '#2C2C2E'
  }
  if (isWindows) {
    DEFAULT_BACKGROUND = '#202020'
  }
}

if (isMac || isWindows) {
  DEFAULT_PAGE_THEME = 'none'
}

const Config = RC('agregore', {
  llm: {
    enabled: true,

    baseURL: 'http://127.0.0.1:11434/v1/',
    // Uncomment this to use OpenAI instead
    // baseURL: 'https://api.openai.com/v1/'
    apiKey: 'ollama',
    model: 'qwen2.5-coder:3b'
  },
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
    background: DEFAULT_BACKGROUND,
    text: DEFAULT_TEXT,
    page: DEFAULT_PAGE_THEME,
    primary: 'var(--ag-color-purple)',
    secondary: 'var(--ag-color-green)',
    indent: '16px',
    'max-width': '666px'
  },

  defaultPage: DEFAULT_PAGE,
  autoHideMenuBar: false,
  searchProvider: DEFAULT_SEARCH_PROVIDER,

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

  // All options here: https://www.npmjs.com/package/web3protocol
  web3Options: {
    chainList: getDefaultChainList(),
    multipleRpcMode: 'fallback'
  },

  // All options here: https://github.com/webtorrent/webtorrent/blob/master/docs/api.md
  btOptions: {
    folder: DEFAULT_BT_DIR
  }
})

export default Config

export function addPreloads (session) {
  const preloadPath = path.join(__dirname, 'settings-preload.js')
  const preloads = session.getPreloads()
  preloads.push(preloadPath)
  session.setPreloads(preloads)
}

ipcMain.handle('settings-save', async (event, configMap) => {
  await save(configMap)
})

export async function save (configMap) {
  const currentRC = await getRCData()
  let hasChanged = false
  for (const [key, value] of Object.entries(configMap)) {
    const existing = getFrom(key, Config)
    if (existing === undefined) continue
    if (value === existing) continue
    hasChanged = true
    setOn(key, Config, value)
    setOn(key, currentRC, value)
  }
  if (hasChanged) {
    await writeFile(MAIN_RC_FILE, JSON.stringify(currentRC, null, '\t'))
  }
}

async function getRCData () {
  try {
    const data = await readFile(MAIN_RC_FILE, 'utf8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

function setOn (path, object, value) {
  if (path.includes('.')) {
    const [key, subkey] = path.split('.')
    if (typeof object[key] !== 'object') {
      object[key] = {}
    }
    object[key][subkey] = value
  } else {
    object[path] = value
  }
}

// No support for more than one level
function getFrom (path, object) {
  if (path.includes('.')) {
    const [key, subkey] = path.split('.')
    if (typeof object[key] !== 'object') return undefined
    return object[key][subkey]
  } else {
    return object[path]
  }
}
