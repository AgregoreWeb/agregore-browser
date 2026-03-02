/**
 * @typedef {() => Promise<import("electron").WebContents|null>} GetBackgroundPage
 */
/**
 * @typedef {Object} HistoryItem
 * @property {string} host
 * @property {string} protocol
 * @property {string} pathname
 * @property {string} url
 * @property {string} title
 * @property {number} timestamp
 */

/**
 * @type {GetBackgroundPage?}
 */
let getBackgroundPage = null
/**
 * @type {string?}
 */
let viewPage = null

/**
 * @param {GetBackgroundPage} backgroundPage 
 */
export function setGetBackgroundPage (backgroundPage) {
  getBackgroundPage = backgroundPage
}

/**
 * 
 * @param {string} page 
 */
export function setViewPage (page) {
  viewPage = page
}

/**
 * @returns {string}
 */
export function getViewPage () {
  if(!viewPage) throw new Error('View page not yet configured')
  return viewPage
}

/**
 * 
 * @param {string} query 
 * @param {number} [maxResults]
 * @returns {AsyncIterator<HistoryItem>}
 */
export async function * search (query = '', maxResults) {
  if(!getBackgroundPage) throw new Error('History extension not yet configured')
  const searchArgs = JSON.stringify([query, maxResults]).slice(1, -1)
  const webContents = await getBackgroundPage()
  if(!webContents) throw new Error('History extension not yet configured')
  await webContents.executeJavaScript(`
    if(window.lastSearch?.return) {
      window.lastSearch?.return()
    }
    window.lastSearch = search(${searchArgs});
    null
  `)

  while (true) {
    const { done, value } = await webContents
      .executeJavaScript('window.lastSearch.next()')

    if (done) break
    yield value
  }
}
