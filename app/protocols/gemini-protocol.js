const makeFetch = require('gemini-fetch')
const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler () {
  return fetchToHandler(async () => {
    const fetch = makeFetch()

    return fetch
  })
}
