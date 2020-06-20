const webview = $('#view')

webview.addEventListener('dom-ready', () => {
  if (process.env.MODE == 'debug') {
    webview.openDevTools()
  }
})

const urlform = $('#urlform')
const urlbar = $('#urlbar')

const backbutton = $('#backbutton')
const frontbutton = $('#frontbutton')

backbutton.addEventListener('click', () => {
  webview.goBack()
})

frontbutton.addEventListener('click', () => {
  webview.goForward()
})

webview.addEventListener('did-start-navigation', ({ detail }) => {
  console.debug('Navigating', detail)
})

webview.addEventListener('did-navigate', updateButtons)

urlform.addEventListener('submit', (e) => {
  e.preventDefault(true)
  webview.src = urlbar.value
  webview.focus()
})

function updateButtons () {
  backbutton.classList.toggle('hidden', !webview.canGoBack())
  frontbutton.classList.toggle('hidden', !webview.canGoForward())
  urlbar.value = webview.getURL()
}

function $ (query) {
  return document.querySelector(query)
}
