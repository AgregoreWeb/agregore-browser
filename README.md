# Agregore Browser
A minimal web browser for the distributed web

<p align="center" style="float: right">
	<img src="./build/icon.png" width="333px">
</p>

[![Build Status](https://travis-ci.com/RangerMauve/agregore-browser.svg?branch=master)](https://travis-ci.com/RangerMauve/agregore-browser)
[Watch the intro video](https://www.youtube.com/watch?v=TnYKvOQB0ts&list=PL7sG5SCUNyeYx8wnfMOUpsh7rM_g0w_cu&index=14)

## Goals

- Enable people to make and use local first apps using the web
- Be minimal (fewer built-in features, leave more to the OS)
- Be open to anything p2p / decentralized / local-first
- Rely on extensions for extra functionality
- Eventually work with mesh networks / BT somehow

## Running

Download an installer from the [releases page](https://github.com/RangerMauve/agregore-browser/releases)

**OR**

- Clone the repo
- `npm install`
- `bash ./rebuild.sh`
- `npm run start`

## Features / Keyboard shortcuts

- Navigate web pages (back and forward with `ctrl+[` and `ctrl+]`)
- Open multiple windows (`ctrl+n`)
- Open links in new windows (right click on element)
- Basic navigation bar (`ctrl+l` to bring into focus)
- Find text on the page (`ctrl+f` to bring into focus, `esc` to hide)
- Dev tools (`ctrl+shift+i`)
- Autocomplete URLs from history (type in the URL bar, up/down to navigate, right to autocomplete)
- Persist open windows when quitting
- Basic Chrome Extension support (hardcoded into the source for now)
- Save files from pages (any protocol, right click it)
- Set as default browser (click Set As Default in the Help menu)

![Agregore demo](agregore-demo-2.gif)

## Supported protocols

- [x] `hyper://`
	- Able to read from archives
	- Able to resolve `dat-dns` domains
	- Able to write create and modify archives
- [x] `dat://`
	- Able to read from archives
	- Able to resovle `dat-dns` domains
	- No `DatArchive` support.
- [ ] ipfs
	- Working on reading from URLs

PRs for more protocols are welcome.

## Configuring keyboard shortcuts

Agregore uses the [rc](https://www.npmjs.com/package/rc#standards) module for loading configuration.

There's a bunch of functionality in there, but the short of it is that you can use the following as a starting point for your configuration.

Save this as a file called `agregorerc` in your "home" or "user" folder. 

```json
{
  "accelerators": {
    "OpenDevTools": "CommandOrControl+Shift+I",
    "NewWindow": "CommandOrControl+N",
    "Forward": "CommandOrControl+]",
    "Back": "CommandOrControl+[",
    "FocusURLBar": "CommandOrControl+L",
    "FindInPage": "CommandOrControl+F",
    "Reload": "CommandOrControl+R",
    "HardReload": "CommandOrControl+Shift+R",
  }
}
```

The accelerators section maps names of actions to [keyboard shortcuts](https://www.electronjs.org/docs/api/accelerator).

You can set these to whatever you want and it will override the defaults listed above.

Check out `app/actions.js` for a full list of action names since some of them don't have keyboard shortcuts by default.

## Fetch API for `hyper://`

### Common Headers

Each response will contain a header for the canonical URL represented as a `Link` header with `rel=canonical`.

Each response will also contain the `Allow` header of all the methods currently allowed. If the archive is writable, this will contain `PUT`.

There is also an `ETag` header which will be a JSON string containging the drive's current `version`. This will change only when the drive has gotten an update of some sort and is monotonically incrementing.

### `fetch('hyper://NAME/example.txt', {method: 'GET'})`

This will attempt to load `example.txt` from the archive labeled by `NAME`.

It will also load `index.html` files automatically for a folder.
You can find the details about how resolution works in the [resolve-dat-path](https://github.com/RangerMauve/resolve-dat-path/blob/master/index.js#L3) module.

`NAME` can either be the 64 character hex key for an archive, a domain to parse with [dat-dns](https://www.npmjs.com/package/dat-dns), or a name for an archive which allows you to write to it.

The response headers will contain `X-Blocks` for the number of blocks of data this file represents on disk, and `X-Blocks-Downloaded` which is the number of blocks from this file that have been downloaded locally.

### `fetch('hyper://NAME/.well-known/dat', {method: 'GET'})`

This is used by the dat-dns module for resoving dns domains to `dat://` URLs.

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



## Contributing

Feel free to open a Github issue if you wish to tackle one of the items on the roadmap, or message @RangerMauve directly on whatever platform you can find them on.

This project uses the [StandardJS](https://standardjs.com/) code style. Please format your code with `standard --fix` or run `npm run lint`.

## Roadmap / TODOs

- [x] Basic browser features
	- [x] Navigate to URL
	- [x] Back / Forward
	- [x] Welcome page
- [x] Basic hypercore-protocol / dat support
- [ ] Better navigation UX
	- [x] Multiple windows
	- [x] Shortcuts for window creation
	- [x] Only allow single instance of the app (reuse the protocol handlers across windows)
	- [x] Make sure protocol handlers open correct URL
	- [x] Make sure page titles update the window title
	- [x] Keyboard shortcuts (use Menu bar with accelerator keys)
		- [x] Dev tools
		- [x] `ctrl+[` and `ctrl+]` for navigating history
		- [x] `ctrl+l` for selecting the navigation bar
	- [x] saveAs context menu (using fetch and fs.createWriteStream())
	- [x] Persist windows on application quit
	- [x] Find in page [API](https://www.electronjs.org/docs/api/web-contents#contentsfindinpagetext-options)
	- [x] Clicking on suggested URL navigates to it
	- [x] Hitting tab when selecting a suggestion sets the URL without navigating
	- [x] Apply context menu handlers to all created windows
	- [x] Hitting escape in URL bar should clear the search options and focus the content
	- [ ] Hit ctlr+shift+n to reopen the most recently closed window
- [ ] fetch API for hyperdrives [GH issue](https://github.com/cliqz-oss/dat-webext/issues/159)
	- [x] Creating an archive
	- [x] PUT/DELETE methods for files / folders
	- [ ] Track created archives for origin in a DB
	- [ ] Access control prompt for writing to origin
- [ ] Sync folder with hyperdrive
	- [ ] Sync from folder to hyperdrive
	- [ ] Sync to folder from hyperdrive
- [ ] Better browser history
	- [x] As an extension?
	- [x] Save history to a DB
	- [x] Search through history?
	- [x] Provide history suggestions when typing in URL bar
	- [ ] Take history out of extension and into leveldb
	- [ ] Add debounce to history search
	- [ ] Add cancellation to history search
	- [ ] Make sure you can always do a direct navigation or duckduckgo search while history is loading
	- [ ] View history page
	- [ ] Preserve history more agressively to avoid crashes
- [ ] Bookmarks
	- [ ] As an extension?
	- [ ] Sync with Hyperdrive API?
	- [ ] Save to folder?
- [ ] Basic EarthStar support
	- [ ] Read from workspace (GET/PUT)
	- [ ] Identity management
	- [ ] PUT/DELETE to workspace
- [ ] Basic IPFS support
	- [ ] Loading files
	- [ ] Directory listing
	- [ ] Loading pretty urls with index.html
	- [ ] IPNS?
- [ ] Basic BitTorrent support
	- [ ] Load web page when opening magnet link
	- [ ] `bt://` protocol for loading individual files
- [ ] fetch API for IPFS (look at how their proxy works?)
- [x] WebXR - Make sure it's working!
- [x] Web extension support via [electron-extensions](https://github.com/sentialx/electron-extensions)
	- [x] Load extensions from `app/extensions/` folder
	- [ ] Somewhere to render badges
	- [ ] Developer options page
	- [ ] Track extensions in a DB
	- [ ] Drag and drop extension folder
- [ ] Configure top-level page to load from URL
	- [ ] Give access to Electron APIs
	- [ ] Shortcut to agregore libraries like `electron-browser-view.js'
- [ ] Password / Account management for web pages [using native OS APIs](https://github.com/atom/node-keytar)
- [ ] Private browsing mode
	- [ ] Option to create page in new "private" session.
	- [ ] Configure multiple containers? :o
- [ ] PWA support
	- [x] Service Workers (Free with Electron)
	- [ ] Install web page to desktop
- [ ] Persist browser settings / history to Hyperdrive
- [ ] Load extensions from p2p protocols.
