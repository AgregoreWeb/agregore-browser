const DEFAULT_PAGE = 'agregore://welcome'
const DEFAULT_SEARCH_PROVIDER = 'https://duckduckgo.com/?ia=web&q=%s'

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

const searchProvider = searchParams.has('searchProvider') ? searchParams.get('searchProvider') : DEFAULT_SEARCH_PROVIDER
window.searchProvider = searchProvider // Used by omni-box.js

if (rawFrame) nav.classList.toggle('hidden', true)

let searchAborter = null

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
  if(searchAborter) searchAborter.abort()
  searchAborter = new AbortController()
  const {signal} = searchAborter
 
  const { query, searchID } = detail

  search.setSearchResults([], query, searchID)
  for await (const result of currentWindow.searchHistory(query)) {
  if(signal.aborted) break
    search.addSearchResult(result)
  }
})

webview.addEventListener('focus', () => {
  currentWindow.focus()
})

webview.addEventListener('resize', ({ detail: rect }) => {
  currentWindow.setBounds(rect)
})

currentWindow.on('navigating', (url) => {
  search.src = url
  find.hide()
  if(searchAborter) searchAborter.abort()
})

currentWindow.on('history-buttons-change', updateButtons)

currentWindow.on('page-title-updated', (title) => {
  pageTitle.innerText = title + ' - Agregore Browser'
})
currentWindow.on('enter-html-full-screen', () => {
  if (!rawFrame) nav.classList.toggle('hidden', true)
  webview.emitResize()
})
currentWindow.on('leave-html-full-screen', () => {
  if (!rawFrame) nav.classList.toggle('hidden', false)
  webview.emitResize()
})
currentWindow.on('update-target-url', async (url) => {
  search.showTarget(url)
})
currentWindow.on('browser-actions-changed', () => {
  actions.renderLatest()
})
currentWindow.on('enter-full-screen', () => {
  if (!rawFrame) nav.classList.toggle('hidden', true)
  webview.emitResize()
})
currentWindow.on('leave-full-screen', () => {
  if (!rawFrame) nav.classList.toggle('hidden', false)
  webview.emitResize()
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
