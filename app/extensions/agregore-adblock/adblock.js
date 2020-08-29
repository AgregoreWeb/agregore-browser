chrome.webRequest.onBeforeRequest.addListener(() => {
    return { cancel: true }
  }, {
  urls: BLOCK_URLS
  },
  ['blocking']
)

