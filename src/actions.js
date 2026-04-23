import { app, shell, webContents } from 'electron'
import fs from 'fs-extra'
import * as history from './history.js'
import Config from './config.js'

/** @import {MenuItemConstructorOptions, BrowserWindow, BaseWindow} from 'electron' */
/** @typedef {NonNullable<MenuItemConstructorOptions['click']>} MenuAction */

const { accelerators, extensions } = Config

const FOCUS_URL_BAR_SCRIPT = `
document.getElementById('search').showInput()
document.getElementById('search').focus()
`

const OPEN_FIND_BAR_SCRIPT = `
document.getElementById('find').show()
`

/**
 *
 * @param {object} options
 * @param {import('./window.js').CreateWindowFN} options.createWindow
 * @returns {Record<string, MenuItemConstructorOptions>}
 */
export function createActions ({
  createWindow
}) {
  return {
    OpenDevTools: {
      label: 'Open Dev Tools',
      accelerator: accelerators.OpenDevTools,
      click: onOpenDevTools
    },
    DownloadPage: {
      label: 'Download Page',
      accelerator: accelerators.DownloadPage,
      click: onDownloadPage
    },
    ViewHistory: {
      label: 'View History',
      accelerator: accelerators.ViewHistory,
      click: onViewHistory
    },
    ViewLocalSites: {
      label: 'View Local Sites',
      accelerator: accelerators.ViewLocalSites,
      click: onViewLocalSites
    },
    NewWindow: {
      label: 'New Window',
      click: onNewWindow,
      accelerator: accelerators.NewWindow
    },
    Forward: {
      label: 'Forward',
      accelerator: accelerators.Forward,
      click: onGoForward
    },
    Back: {
      label: 'Back',
      accelerator: accelerators.Back,
      click: onGoBack
    },
    Up: {
      label: 'Up',
      accelerator: accelerators.Up,
      click: onGoUp
    },
    ForwardAlt: {
      label: 'Forward',
      accelerator: 'Alt+Right',
      click: onGoForward,
      visible: false
    },
    BackAlt: {
      label: 'Back',
      accelerator: 'Alt+Left',
      click: onGoBack,
      visible: false
    },
    UpAlt: {
      label: 'Up',
      accelerator: 'Alt+Up',
      click: onGoUp,
      visible: false
    },
    FocusURLBar: {
      label: 'Focus URL Bar',
      click: onFocusURlBar,
      accelerator: accelerators.FocusURLBar
    },
    FindInPage: {
      label: 'Find in Page',
      click: onFindInPage,
      accelerator: accelerators.FindInPage
    },
    Reload: {
      label: 'Reload',
      accelerator: accelerators.Reload,
      click: onReload
    },
    HardReload: {
      label: 'Hard Reload',
      accelerator: accelerators.HardReload,
      click: onHardReload
    },
    LearnMore: {
      label: 'Learn More',
      accelerator: accelerators.LearnMore,
      click: onLearMore
    },
    SetAsDefault: {
      label: 'Set as Default Browser',
      accelerator: accelerators.SetAsDefault,
      click: onSetAsDefault
    },
    SetAsDefaultMagnet: {
      label: 'Set as Default for Torrents',
      accelerator: accelerators.SetAsDefaultMagnet,
      click: onSetAsDefaultMagnet
    },
    OpenExtensionFolder: {
      label: 'Open Extensions Folder',
      accelerator: accelerators.OpenExtensionFolder,
      click: onOpenExtensionFolder
    },
    OpenDataFolder: {
      label: 'Open Data Folder',
      accelerator: accelerators.OpenDataFolder,
      click: onOpenDataFolder
    },
    EditConfigFile: {
      label: 'Edit Configuration File',
      accelerator: accelerators.EditConfigFile,
      click: onEditConfigFile
    }
  }
  async function onSetAsDefault () {
    app.setAsDefaultProtocolClient('http')
    app.setAsDefaultProtocolClient('https')
  }

  async function onSetAsDefaultMagnet () {
    app.setAsDefaultProtocolClient('magnet')
  }

  async function onLearMore () {
    await shell.openExternal('hyper://agregore.mauve.moe/')
  }

  /** @type {MenuAction} */
  function onOpenDevTools (menuItem, focusedWindow) {
    const contents = getContents(focusedWindow)
    for (const webContents of contents) {
      webContents.openDevTools()
    }
  }

  /** @type {MenuAction} */
  function onNewWindow () {
    createWindow()
  }

  /** @type {MenuAction} */
  function onFocusURlBar (menuItem, focusedWindow) {
    // @ts-ignore It's okay, it's a BrowserWindow
    focusedWindow.webContents.focus()
    // @ts-ignore It's okay, it's a BrowserWindow
    focusedWindow.webContents.executeJavaScript(FOCUS_URL_BAR_SCRIPT, true)
  }

  /** @type {MenuAction} */
  function onFindInPage (menuItem, focusedWindow) {
    // @ts-ignore It's okay, it's a BrowserWindow
    focusedWindow.webContents.focus()
    // @ts-ignore It's okay, it's a BrowserWindow
    focusedWindow.webContents.executeJavaScript(OPEN_FIND_BAR_SCRIPT, true)
  }

  /** @type {MenuAction} */
  function onReload (menuItem, focusedWindow) {
  // Reload
    for (const webContents of getContents(focusedWindow)) {
      webContents.reload()
    }
  }

  /** @type {MenuAction} */
  function onHardReload (menuItem, focusedWindow) {
  // Hard reload
    for (const webContents of getContents(focusedWindow)) {
      webContents.reloadIgnoringCache()
    }
  }

  /** @type {MenuAction} */
  function onGoForward (menuItem, focusedWindow) {
    for (const webContents of getContents(focusedWindow)) {
      webContents.goForward()
    }
  }

  /** @type {MenuAction} */
  function onGoBack (menuItem, focusedWindow) {
    for (const webContents of getContents(focusedWindow)) {
      webContents.goBack()
    }
  }

  /** @type {MenuAction} */
  function onGoUp (menuItem, focusedWindow) {
    for (const webContents of getContents(focusedWindow)) {
      const currentURL = webContents.getURL()
      const next = currentURL.endsWith('/') ? '../' : './'
      const toLoad = new URL(next, currentURL).href
      webContents.loadURL(toLoad)
    }
  }

  /** @type {MenuAction} */
  function onDownloadPage () {
    const focusedWebContents = webContents.getFocusedWebContents()
    if (!focusedWebContents) return console.log('No focused content to download')
    focusedWebContents.downloadURL(focusedWebContents.getURL())
  }

  /**
   *
   * @param {BrowserWindow|BaseWindow|undefined} focusedWindow
   */
  function getContents (focusedWindow) {
    if (!focusedWindow) return []
    // @ts-ignore
    const views = focusedWindow.getBrowserViews()
    // @ts-ignore
    if (!views.length) return [focusedWindow.webContents]
    // @ts-ignore
    return views.map(({ webContents }) => webContents)
  }

  /** @type {MenuAction} */
  function onOpenExtensionFolder () {
    (async () => {
      try {
        const { dir } = extensions
        await fs.ensureDir(dir)

        await shell.openPath(dir)
      } catch (e) {
        console.error(e.stack)
      }
    })()
  }

  /** @type {MenuAction} */
  function onOpenDataFolder () {
    (async () => {
      try {
        await shell.openPath(app.getPath('userData'))
      } catch (e) {
        console.error(e.stack)
      }
    })()
  }
  /** @type {MenuAction} */
  function onEditConfigFile () {
    createWindow('agregore://settings')
  }

  /** @type {MenuAction} */
  function onViewHistory () {
    createWindow(history.getViewPage())
  }

  /** @type {MenuAction} */
  function onViewLocalSites () {
    createWindow('agregore://sites')
  }
}
