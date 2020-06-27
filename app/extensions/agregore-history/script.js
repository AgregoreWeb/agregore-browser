/* global idb, browser, IDBKeyRange */

if (!window.browser) window.browser = window.chrome

const TAB_CHECK_DELAY = 100
const HISTORY_DB = 'history'
const HISTORY_VERSION = 1

const HISTORY_STORE = 'navigated'
const MAX_RESULTS = 8

main()

async function main () {
  const db = await idb.openDB(HISTORY_DB, HISTORY_VERSION, {
    upgrade
  })

  browser.webNavigation.onCompleted.addListener(onCompleted)
  window.db = db
  window.search = search

  async function * search (query = '', maxResults = MAX_RESULTS) {
    let sent = 0
    const seen = new Set()

    const regexText = query.split(' ').reduce((result, letter) => `${result}.*${letter}`, '')
    const filter = new RegExp(regexText, 'iu')

    const index = db.transaction(HISTORY_STORE, 'readonly').store.index('timestamp')
    const start = Date.now()
    const range = IDBKeyRange.upperBound(start)
    const iterator = index.iterate(range, 'prev')

    for await (const { value } of iterator) {
      const { search: searchString, url } = value
      if (searchString.match(filter)) {
        if (seen.has(url)) continue
        seen.add(url)
        yield value
        sent++
        if (sent >= MAX_RESULTS) break
      }
    }
  }

  async function onCompleted ({ timeStamp, tabId }) {
    await delay(TAB_CHECK_DELAY)

    const tab = await getTab(tabId)
    const { url, title } = tab

    const { host, protocol, pathname } = new URL(url)

    if (protocol === 'agregore-browser:') return console.debug('Skipping saving', url)

    const historyItem = {
      host,
      protocol,
      pathname,
      url,
      title,
      timestamp: timeStamp,
      search: `${url} ${title}`
    }

    console.log('Navigation event', historyItem)

    await db.add(HISTORY_STORE, historyItem)
  }
}

async function upgrade (db) {
  const store = db.createObjectStore(HISTORY_STORE, {
    // The 'id' property of the object will be the key.
    keyPath: 'id',
    // If it isn't explicitly set, create a value by auto incrementing.
    autoIncrement: true
  })

  store.createIndex('search', 'search', { unique: false })
  store.createIndex('timestamp', 'timestamp', { unique: false })
  store.createIndex('url', 'url', { unique: false })
  store.createIndex('title', 'title', { unique: false })
  store.createIndex('host', 'host', { unique: false })
  store.createIndex('protocol', 'protocol', { unique: false })
}

async function getTab (id) {
  return new Promise((resolve) => {
    browser.tabs.get(id, resolve)
  })
}

async function delay (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
