const fetchToHandler = require('./fetch-to-handler')

module.exports = async function createHandler (options, session) {
  return fetchToHandler(async () => {
    const { makeSsbFetch } = require('ssb-fetch')
    const appname = process.env.ssb_appname || options.appname || 'ssb'

    /** connect to running ssb-server */
    if (!!options.ssbd === false) {
      const fetch = makeSsbFetch({ ...options, appname })
      return fetch
    }

    /** bundle ssb-server with agregore browser */
    const ssbd = require('ssbd')

    const sbot = ssbd({ ...options, appname })

    const fetch = makeSsbFetch({ ...options, appname, sbot })
    return fetch
  }, session)
}
