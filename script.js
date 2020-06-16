const webview = $('webview')

webview.addEventListener('dom-ready', () => {
  webview.openDevTools()
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

webview.addEventListener('load-commit', ({ url, isMainFrame }) => {
  if (!isMainFrame) return
  urlbar.value = url

  updateButtons()
})

urlform.addEventListener('submit', (e) => {
  e.preventDefault(true)
  webview.src = urlbar.value
  webview.focus()
})

function updateButtons () {
  backbutton.classList.toggle('hidden', !webview.canGoBack())
  frontbutton.classList.toggle('hidden', !webview.canGoForward())
}

function $ (query) {
  return document.querySelector(query)
}
