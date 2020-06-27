const { pageContextMenu } = require('./context-menus')
const { remote } = require('electron')

const history = remote.require('./history')

const DEFAULT_PAGE = 'agregore-browser://welcome'

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

const navOptions = $('#navoptions')

const searchParams = new URL(window.location.href).searchParams

const toNavigate = searchParams.has('url') ? searchParams.get('url') : DEFAULT_PAGE

let firstLoad = true

webview.src = toNavigate

urlbar.addEventListener('focus', () => {
  urlbar.select()
})

backbutton.addEventListener('click', () => {
  webview.goBack()
})

frontbutton.addEventListener('click', () => {
  webview.goForward()
})

webview.addEventListener('did-start-navigation', ({ detail }) => {
  const url = detail[1]
  urlbar.value = url
  if (firstLoad && (toNavigate === DEFAULT_PAGE)) {
    urlbar.focus()
    firstLoad = false
  }
})

webview.addEventListener('did-navigate', updateButtons)

webview.view.webContents.on('context-menu', pageContextMenu.bind(webview.view))

webview.addEventListener('page-title-updated', ({ detail }) => {
  const title = detail[1]
  pageTitle.innerText = title + ' - Agregore Browser'
})

urlform.addEventListener('submit', (e) => {
  e.preventDefault(true)

  const item = getNavItem()

  if (item) {
    navigateTo(item.dataset.url)
  } else {
    navigateTo(urlbar.value)
  }

  navOptions.innerHTML = ''
})

function getNavItem () {
  return navOptions.querySelector('[data-selected]') || navOptions.firstElementChild
}

function selectNextNavItem () {
  const item = getNavItem()

  if (!item) return

  const sibling = item.nextElementSibling

  if (!sibling) return

  item.removeAttribute('data-selected')
  sibling.setAttribute('data-selected', 'selected')
}

function selectPreviousNavItem () {
  const item = getNavItem()

  if (!item) return

  const sibling = item.previousElementSibling

  if (!sibling) return

  item.removeAttribute('data-selected')
  sibling.setAttribute('data-selected', 'selected')
}

urlbar.addEventListener('input', async () => {
  const query = urlbar.value

  if (!query) {
    navOptions.innerHTML = ''
    return
  }

  const results = await history.search(query)

  if (urlbar.value !== query) return console.debug('Urlbar changed since query finished', urlbar.value, query)

  let finalItems = ''

  if (isURL(query)) {
    finalItems += makeNavItem(query, `Go to ${query}`)
  } else if (looksLikeDomain(query)) {
    finalItems += makeNavItem(`https://${query}`, `Go to https://${query}`)
  } else {
    finalItems += makeNavItem(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      `Search for "${query}" on DuckDuckGo`
    )
  }

  finalItems += results
    .map(({ title, url }) => makeNavItem(url, `${title} - ${url}`))
    .join('\n')

  // TODO: Don't use inner HTML, constuct a DOM element. 😂
  navOptions.innerHTML = finalItems

  getNavItem().setAttribute('data-selected', 'selected')
})

urlbar.addEventListener('keydown', ({ keyCode }) => {
  console.log('Key pressed down')
  // Pressed down arrow
  if (keyCode === 40) selectNextNavItem()

  // Pressed up arrow
  if (keyCode === 38) selectPreviousNavItem()
})

function makeNavItem (url, text) {
  return `<button data-url="${url}">${text}</button>`
}

function updateButtons () {
  backbutton.classList.toggle('hidden', !webview.canGoBack())
  frontbutton.classList.toggle('hidden', !webview.canGoForward())
}

function $ (query) {
  return document.querySelector(query)
}

function isURL (string) {
  try {
    return !!new URL(string)
  } catch {
    return false
  }
}

function looksLikeDomain (string) {
  return !string.match(/\s/) && string.includes('.')
}

function navigateTo (url) {
  webview.src = url
  webview.focus()
}
