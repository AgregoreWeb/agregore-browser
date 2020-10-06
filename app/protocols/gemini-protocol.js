const fetch = require('gemini-fetch')()
const render = require('gemini-to-html/render')
const parse = require('gemini-to-html/parse')
const { Readable } = require('stream')
const MIMEType = require('whatwg-mimetype')

module.exports = async function createHandler () {
  return async function protocolHandler (req, sendResponse) {
    const { url, headers: requestHeaders, method, uploadData } = req

    console.log(req)

    const body = uploadData ? (
      uploadData.length > 1 ? uploadData : uploadData[0]
    ) : null

    const response = await fetch(url, { headers: requestHeaders, method, body })

    const { status: statusCode, body: data, headers: responseHeaders } = response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Allow-CSP-From': '*',
      'Cache-Control': 'no-cache'
    }

    for (const [key, value] of responseHeaders) {
      headers[key] = value
    }

    const contentType = MIMEType.parse(headers['content-type'])
    // Rewrite gemini pages to use custom renderer
    if (contentType && contentType.essence === 'text/gemini') {
      const pageText = await response.text()
      const tokens = parse(pageText)

      const content = render(tokens)

      // Update the content type header to text/html while preserving parameters
      contentType.type = 'text'
      contentType.subtype = 'html'
      headers['content-type'] = contentType.toString()

      return sendResponse({
        statusCode,
        headers,
        data: intoStream(generatePage(url, tokens, content))
      })
    }

    sendResponse({
      statusCode,
      headers,
      data
    })
  }
}

function generatePage (url, tokens, content) {
  const title = tokens.find(({ type }) => type === 'header') || { content: url }
  return `
<!DOCTYPE html>
<title>${title.content}</title>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<style>
@import url("agregore://theme/style.css");
</style>

${content}
`
}

function intoStream (data) {
  return new Readable({
    read () {
      this.push(data)
      this.push(null)
    }
  })
}
