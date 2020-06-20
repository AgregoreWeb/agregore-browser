const webview = $('#view')

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
  const url = webview.getURL()
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
