const fetch = require('gemini-fetch')()
const render = require('gemini-to-html/render')
const parse = require('gemini-to-html/parse')
const { Readable } = require('stream')

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

    // Rewrite gemini pages to use custom renderer
    if (headers['content-type'] === 'text/gemini') {
      const pageText = await response.text()
      const tokens = parse(pageText)

      const content = render(tokens)

      headers['content-type'] = 'text/html'

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
:root {
  --ag-color-purple: #6e2de5;
  --ag-color-black: #111;
  --ag-color-white: #F2F2F2;
  --ag-color-green: #2de56e;
}

html, body {
  background: var(--ag-color-black);
  color: var(--ag-color-white);
  font-family: system-ui;
}

a {
  color: var(--ag-color-purple);
  text-decoration: none;
  margin: 0.1em;
  display: block;
}

br {
  display: none;
}

li {
  list-style-type: " ⟐ ";
}

a:visited {
  color: var(--ag-color-green);
}

*:focus {
  outline: 2px solid var(--ag-color-green);
}

h1 {
  font-weight: bold;
  color: var(--ag-color-purple);
}

h2,h3,h4 {
  text-decoration: underline;
  text-decoration-color: var(--ag-color-purple);
}
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
