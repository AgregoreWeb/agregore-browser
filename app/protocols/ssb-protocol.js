const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const { makeSsbFetch } = require('ssb-fetch')

    const fetch = makeSsbFetch(options)

    return fetch
  }, session)
}
