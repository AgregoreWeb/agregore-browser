const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const ssbFetch = require('ssb-fetch')

    const fetch = ssbFetch(options)

    return fetch
  }, session)
}
