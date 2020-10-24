# Fetch API for `ipfs://` and `ipns://`

This API is implemented in [js-ipfs-fetch](https://github.com/RangerMauve/js-ipfs-fetch).

### `await fetch('ipfs://CID/example.txt')`

If you specify a URL for a file (no trailing slashes), it will be loaded from IPFS and the content will be sent as the response body.

The response headers will contain a `Content-Length` header set to the size of the file.

### `await fetch('ipfs://CID/example/')`

If you specify a URL for a folder (has a trailing slash), the folder will be enumerated from IPFS and an HTML page listing its various files will be rendered.

Hyperlinks to files/folders will be automatically generated as relative URLs.

Links will have a trailing slash for folders.

If the folder contains an `index.html` it will be served as a file instead of performing a directory listing.

### `await fetch('ipfs://CID/example/', {headers: {'X-Resolve': none}})`

If you specify the `X-Resolve: none` header in your request, the resolution of `index.html` will be ignored and a directory listing will always be performed.

### `await fetch('ipfs://CID/example/', {headers: {Accept: 'application/json'}})`

If you specify a URL for a folder, and set the `Accept` header to only contain `application/json`, the directory will be enumerated and the list of files/folders will be returned as a JSON array.

You can get the file/folder list out of the response using `await response.json()`.

Names will have a trailing slash for folders.

### `await fetch('ipfs://CID/example.txt', {method: 'HEAD'})`

If you set the method to `HEAD`, it will be like doing a `GET` request but without actually loading data.

This is useful for getting the `Content-Length` or checking if a file exists.

### `await fetch('ipfs://CID/example.txt', { headers: { Range: 'bytes=0-4' })`

You can specify the `Range` header when making a request to load a subset of a file.

### `await fetch('ipfs:///example.txt', {methhod: 'post', body: 'Hello World!'})`

You can upload files to IPFS by using `POST` messages.

The response body will contain the `ipfs://` URL for your data.

Please open a GitHub issue if you have ideas for how to support multiple files in a fetch-compliant way.

### `await fetch('ipns://CID/example.txt')`

You can specify an IPNS URL to have it resolve to whatever resource you wanted using the Inter-Planetary Naming System

### `await fetch('ipns://self', {method: 'publish', body: 'ipfs://CID/example.txt'})`

You can publish to IPNS using the `PUBLISH` method.

The `body` should contain the `ipfs://` URL you want to point to.

The response will be an `ipns://` URL for your data.

It's best to point at directories when possible so that they can be treated as origins within browser contexts.

Specify the key name in the `origin` portion of the ipns URL.
If the key doesn't exist, it will ge generated.

Please open a GitHub issue if you have ideas for how to do key import and export.
