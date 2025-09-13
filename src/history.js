let getBackgroundPage = null
let viewPage = null

export function setGetBackgroundPage (backgroundPage) {
  getBackgroundPage = backgroundPage
}

export function setViewPage (page) {
  viewPage = page
}

export function getViewPage () {
  return viewPage
}

export async function * search (query = '', ...args) {
  const searchArgs = JSON.stringify([query, ...args]).slice(1, -1)
  const webContents = await getBackgroundPage()
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
