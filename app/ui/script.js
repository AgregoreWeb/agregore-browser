const DEFAULT_PAGE = 'agregore://welcome'

const webview = $('#view')
// Kyran: Using variable name "top" causes issues for some reason? I would assume it's because of another one of the UI scripts but it doesn't seem like that's the case.
const nav = $('#top')
const search = $('#search')
const find = $('#find')
const actions = $('#actions')

const currentWindow = window.getCurrentWindow()

const pageTitle = $('title')

const searchParams = new URL(window.location.href).searchParams

const toNavigate = searchParams.has('url') ? searchParams.get('url') : DEFAULT_PAGE

const rawFrame = searchParams.get('rawFrame') === 'true'
const noNav = searchParams.get('noNav') === 'true'

if (rawFrame) nav.classList.toggle('hidden', true)

window.addEventListener('load', () => {
  if (noNav) return
  console.log('toNavigate', toNavigate)
  currentWindow.loadURL(toNavigate)
  webview.emitResize()
})

search.addEventListener('back', () => {
  currentWindow.goBack()
})

search.addEventListener('forward', () => {
  currentWindow.goForward()
})

search.addEventListener('up', () => {
  const next = search.src.endsWith('/') ? '../' : './'
  currentWindow.loadURL(new URL(next, search.src).href)
})

search.addEventListener('navigate', ({ detail }) => {
  const { url } = detail

  navigateTo(url)
})

search.addEventListener('unfocus', async () => {
  await currentWindow.focus()
  search.src = await currentWindow.getURL()
})

search.addEventListener('search', async ({ detail }) => {
  const { query, searchID } = detail

  const results = await currentWindow.searchHistory(query, searchID)

  search.setSearchResults(results, query, searchID)
})

webview.addEventListener('focus', () => {
  currentWindow.focus()
})

webview.addEventListener('resize', ({ detail: rect }) => {
  currentWindow.setBounds(rect)
})

currentWindow.on('navigating', (url) => {
  search.src = url
})

currentWindow.on('history-buttons-change', updateButtons)

currentWindow.on('page-title-updated', (title) => {
  pageTitle.innerText = title + ' - Agregore Browser'
})
currentWindow.on('enter-html-full-screen', () => {
  if (!rawFrame) nav.classList.toggle('hidden', true)
})
currentWindow.on('leave-html-full-screen', () => {
  if (!rawFrame) nav.classList.toggle('hidden', false)
})
currentWindow.on('update-target-url', async (url) => {
  search.showTarget(url)
})
currentWindow.on('browser-actions-changed', () => {
  actions.renderLatest()
})

find.addEventListener('next', ({ detail }) => {
  const { value, findNext } = detail

  currentWindow.findInPage(value, { findNext })
})

find.addEventListener('previous', ({ detail }) => {
  const { value, findNext } = detail

  currentWindow.findInPage(value, { forward: false, findNext })
})

find.addEventListener('hide', () => {
  currentWindow.stopFindInPage('clearSelection')
})

function updateButtons ({ canGoBack, canGoForward }) {
  search.setAttribute('back', canGoBack ? 'visible' : 'hidden')
  search.setAttribute('forward', canGoForward ? 'visible' : 'hidden')
}

function $ (query) {
  return document.querySelector(query)
}

async function navigateTo (url) {
  const currentURL = await currentWindow.getURL()
  if (currentURL === url) {
    console.log('Reloading')
    currentWindow.reload()
  } else {
    currentWindow.loadURL(url)
    currentWindow.focus()
  }
}
