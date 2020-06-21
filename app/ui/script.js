const { remote } = require('electron')
const { Menu, MenuItem } = remote

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

const searchParams = new URL(window.location.href).searchParams

const toNavigate = searchParams.has('url') ? searchParams.get('url') : 'agregore-browser://welcome'

webview.src = toNavigate

const openDevTools = new MenuItem({
  label: 'Toggle Developer Tools For Frame',
  click: () => webview.openDevTools(),
  accelerator: 'CommandOrControl+Shift+I'
})

const menu = Menu.getApplicationMenu()

const viewMenu = menu.items[2]

viewMenu.submenu.insert(3, openDevTools)

const existingDevtools = viewMenu.submenu.items[2]

existingDevtools.registerAccelerator = false

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
