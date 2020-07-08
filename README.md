# Agregore Browser
A minimal web browser for the distributed web

<p align="center" style="float: right">
	<img src="./build/icon.png" width="333px">
</p>

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

## Supported protocols

- [x] `hyper://`
	- Able to read from archives
	- Able to resolve `dat-dns` domains
- [x] `dat://`
	- Able to read from archives
	- Able to resovle `dat-dns` domains
	- 😢 No `DatArchive` support.
	- A bunch of websites are probably broken.
- [ ] ipfs
	- Working on reading from URLs

PRs for more protocols are welcome.

## Features / Keyboard shortcuts

- Navigate web pages (back and forward with `ctrl+[` and `ctrl+]`)
- Open multiple windows (`ctrl+n`)
- Open links in new windows (right click on element)
- Basic navigation bar (`ctrl+l` to bring into focus)
- Dev tools (`ctrl+shift+i`)
- Autocomplete URLs from history (type in the URL bar)
- Persist open windows when quitting
- Basic Chrome Extension support (hardcoded into the source for now)
- Save files from pages (any protocol)

![Agregore demo](agregore-demo-2.gif)

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
- [ ] fetch API for hyperdrives [GH issue](https://github.com/cliqz-oss/dat-webext/issues/159)
	- [ ] Creating an archive (scoped to page origin)
	- [ ] PUT/DELETE methods for files / folders
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
	- [ ] View history page
- [ ] Bookmarks
	- [ ] As an extension?
	- [ ] Sync with Hyperdrive API?
	- [ ] Save to folder?
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
