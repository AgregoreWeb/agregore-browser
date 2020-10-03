# Fetch API for `gemini://`

### `fetch('gemini://hostname/path')`

You can currently only fetch pages from Gemini.
The status codes from requests are multiplied by `10`.
When the interface returns a `text/gemini` page, it will be rendered to HTML with agregore-provided styling.
`100` and `110` status codes mean that you should be supplying data in the query string of the URL.
There's currently no support for certificate management stuff.
