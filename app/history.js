
let getBackgroundPage = null

module.exports = {
  setGetBackgroundPage,
  search
}

function setGetBackgroundPage (backgroundPage) {
  getBackgroundPage = backgroundPage
}

async function search (query = '') {
  const webContents = await getBackgroundPage()

  return webContents.executeJavaScript(`
    (async () => {
      let result = []
      for await(let item of search(${JSON.stringify(query)})) {
        result.push(item)
      }
      return result
    })()
  `)
}
