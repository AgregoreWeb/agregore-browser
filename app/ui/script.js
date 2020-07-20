const { pageContextMenu } = require('./context-menus')

const DEFAULT_PAGE = 'agregore://welcome'

const webview = $('#view')
const search = $('#search')
const find = $('#find')

webview.addEventListener('dom-ready', () => {
  if (process.env.MODE === 'debug') {
    webview.openDevTools()
  }
})

const pageTitle = $('title')

const searchParams = new URL(window.location.href).searchParams

const toNavigate = searchParams.has('url') ? searchParams.get('url') : DEFAULT_PAGE

webview.src = toNavigate

search.addEventListener('back', () => {
  webview.goBack()
})

search.addEventListener('forward', () => {
  webview.goForward()
})

search.addEventListener('navigate', ({ detail }) => {
  const { url } = detail

  navigateTo(url)
})

search.addEventListener('unfocus', () => {
  webview.focus()
  search.src = webview.getURL()
})

webview.addEventListener('did-start-navigation', ({ detail }) => {
  const url = detail[1]
  const isMainFrame = detail[3]
  if (!isMainFrame) return
  search.src = url
})

webview.addEventListener('did-navigate', updateButtons)

webview.view.webContents.on('context-menu', pageContextMenu.bind(webview.view))

webview.addEventListener('page-title-updated', ({ detail }) => {
  const title = detail[1]
  pageTitle.innerText = title + ' - Agregore Browser'
})

webview.addEventListener('new-window', ({ detail }) => {
  const options = detail[4]

  if (options && options.webContents) {
    options.webContents.on('context-menu', pageContextMenu.bind(webview.view))
  }
})

find.addEventListener('next', ({ detail }) => {
  const { value, findNext } = detail

  webview.findInPage(value, { findNext })
})

find.addEventListener('previous', ({ detail }) => {
  const { value, findNext } = detail

  webview.findInPage(value, { forward: false, findNext })
})

find.addEventListener('hide', () => {
  webview.stopFindInPage('clearSelection')
})

function updateButtons () {
  search.setAttribute('back', webview.canGoBack() ? 'visible' : 'hidden')
  search.setAttribute('forward', webview.canGoForward() ? 'visible' : 'hidden')
}

function $ (query) {
  return document.querySelector(query)
}

function navigateTo (url) {
  if (webview.getURL() === url) {
    console.log('Reloading')
    webview.reload()
  } else {
    webview.src = url
    webview.focus()
  }
}
