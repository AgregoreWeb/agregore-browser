
let getBackgroundPage = null

export function setGetBackgroundPage (backgroundPage) {
  getBackgroundPage = backgroundPage
}

export async function search (query = '') {
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
