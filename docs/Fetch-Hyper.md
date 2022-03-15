# Fetch API for `hyper://`

This API is implemented in [dat-fetch](https://github.com/RangerMauve/dat-fetch)

### Common Headers

Each response will contain a header for the canonical URL represented as a `Link` header with `rel=canonical`.

Each response will also contain the `Allow` header of all the methods currently allowed. If the archive is writable, this will contain `PUT`.

There is also an `ETag` header which will be a JSON string containing the drive's current `version`. This will change only when the drive has gotten an update of some sort and is monotonically incrementing.

### `fetch('hyper://NAME/example.txt', {method: 'GET'})`

This will attempt to load `example.txt` from the archive labeled by `NAME`.

It will also load `index.html` files automatically for a folder.
You can find the details about how resolution works in the [resolve-dat-path](https://github.com/RangerMauve/resolve-dat-path/blob/master/index.js#L3) module.

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

The response headers will contain `X-Blocks` for the number of blocks of data this file represents on disk, and `X-Blocks-Downloaded` which is the number of blocks from this file that have been downloaded locally.

### `fetch('hyper://NAME/.well-known/dat', {method: 'GET'})`

This is used by the dat-dns module for resolving dns domains to `dat://` URLs.

This will return some text which will have a `dat://` URL of your archive, followed by a newline and a TTL for the DNS record.

### `fetch('hyper://NAME/example/', {method: 'GET'})`

When doing a `GET` on a directory, you will get a directory listing.

By default it will render out an HTML page with links to files within that directory.

You can set the `Accept` header to `application/json` in order to have it return a JSON array with file names.

e.g.

```json
["example.txt", "posts/", "example2.md"]
```

Files in the directory will be listed under their name, sub-directories will have a `/` appended to them.

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

### `fetch('hyper://NAME/example.txt', {method: 'GET', headers: {'X-Resolve': 'none'}})`

Setting the `X-Resolve` header to `none` will prevent resolving `index.html` files and will attempt to load the path as is.
This can be useful for list files in a directory that would normally render as a page.

You should omit the header for the default behavior, different values may be supported in the future.

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

The response headers will contain `X-Blocks` for the number of blocks of data this file represents on disk, and `X-Blocks-Downloaded` which is the number of blocks from this file that have been downloaded locally.

### `fetch('hyper://NAME/example.txt', {method: 'PUT', body: 'Hello World'})`

You can add files to archives using a `PUT` method along with a `body`.

The `body` can be either a `String`, an `ArrayBuffer`, a `Blob`, a WHATWG `ReadableStream`, a Node.js `Stream`,
or electron's [UploadData](https://www.electronjs.org/docs/api/structures/upload-data) object (make sure to specify the `session` argument in the `makeFetch` function for electron support).

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

Your `NAME` will likely be a `name` in most cases to ensure you have a writeable archive.

### `fetch('hyper://NAME/example.txt', {method: 'DELETE'})`

You can delete a file in an archive by using the `DELETE` method.

You cannot delete directories if they are not empty.

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

### `fetch('hyper://NAME/example.txt', {method: 'DOWNLOAD'})`

You can download a file or an entire folder using the `DOWNLOAD` method.

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

You can use `/` for the path to download the entire contents

### `fetch('hyper://NAME/example.txt', {method: 'CLEAR'})`

You can clear the data stored for a file using the `CLEAR` method.

This is like the opposite of the `DOWNLOAD` method.

This does not delete data, it only deletes the cached data from disk.

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

You can use `/` for the path to clear all data for the archive.

### `fetch('hyper://NAME/`, {method: 'TAG', body: 'Tag name here'})`

You can add a tag a version of the archive with a human readable name (like SPAGHETTI).

You can place the name of the tag into the `body` of the request.

Afterwards you can load the archive at that given version with `hyper://NAME+TAG_NAME`. E.g. `hyper://123kjh213kjh123+v4.20/example.txt`

### `fetch('hyper://NAME/', {method: 'TAGS'})`

You can get a list of all tags using the `TAGS` method.

The response will be a JSON object which maps tag names to archive versions.

Use `await response.json()` to get the data out.

### `fetch('hyper://NAME+TAG_NAME/', {method: 'TAG-DELETE'})`

You can delete a given tag with the `TAG-DELETE` method.

Specify the tag you want in the URL, and it'll be removed from the tags list.
