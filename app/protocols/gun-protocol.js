const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const makeFetch = require('gun-fetch')

    const fetch = makeFetch(options)

    return fetch
  }, session)
}
