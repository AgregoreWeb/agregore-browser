const { pageContextMenu } = require('./context-menus')

const webview = $('#view')

webview.addEventListener('dom-ready', () => {
  if (process.env.MODE === 'debug') {
    webview.openDevTools()
  }
})

const urlform = $('#urlform')
const urlbar = $('#urlbar')

const backbutton = $('#backbutton')
const frontbutton = $('#frontbutton')

const pageTitle = $('title')

const searchParams = new URL(window.location.href).searchParams

const toNavigate = searchParams.has('url') ? searchParams.get('url') : 'agregore-browser://welcome'

webview.src = toNavigate

backbutton.addEventListener('click', () => {
  webview.goBack()
})

frontbutton.addEventListener('click', () => {
  webview.goForward()
})

webview.addEventListener('did-start-navigation', ({ detail }) => {
  const url = detail[1]
  urlbar.value = url
})

webview.addEventListener('did-navigate', updateButtons)

webview.view.webContents.on('context-menu', pageContextMenu.bind(webview.view))

webview.addEventListener('page-title-updated', ({ detail }) => {
  const title = detail[1]
  pageTitle.innerText = title + ' - Agregore Browser'
})

urlform.addEventListener('submit', (e) => {
  e.preventDefault(true)
  navigateTo(urlbar.value)
})

function updateButtons () {
  backbutton.classList.toggle('hidden', !webview.canGoBack())
  frontbutton.classList.toggle('hidden', !webview.canGoForward())
}

function $ (query) {
  return document.querySelector(query)
}

function navigateTo (url) {
  webview.src = url
  webview.focus()
}
