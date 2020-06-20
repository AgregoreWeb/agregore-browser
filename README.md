# Agregore Browser
A minimal web browser for the distributed web

<p align="center" style="float: right">
	<img src="./build/icon.png" width="333px">
</p>

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

## Contributing

Feel free to open a Github issue if you wish to tackle one of the items on the roadmap, or message @RangerMauve directly on whatever platform you can find them on.

This project uses the [StandardJS](https://standardjs.com/) code style. Please format your code with `standard --fix` or run `npm run lint`.

## Roadmap

- [x] Basic browser features
	- [x] Navigate to URL
	- [x] Back / Forward
	- [x] Welcome page
- [x] Basic hypercore-protocol / dat support
- [ ] Basic IPFS support
	- [ ] Loading files
	- [ ] Directory listing
	- [ ] Loading pretty urls with index.html
	- [ ] IPNS?
- [ ] Basic BitTorrent support (loading)
	- [ ] Load web page when opening magnet link
	- [ ] `bt://` protocol for loading individual files
- [ ] Better navigation UX
	- [x] Multiple windows
	- [ ] Shortcuts for window creation
	- [x] Only allow single instance of the app (reuse the protocol handlers across windows)
	- [x] Make sure protocol handlers open correct URL
	- [ ] Make sure page titles update the window title
	- [ ] Keyboard shortcuts (use Menu bar with accelerator keys)
		- [x] Dev tools
		- `ctrl+[` and `ctrl+]` for navigating history
		- `ctrl+l` for selecting the navigation bar
- [ ] Better browser history
	- [ ] Save history to a DB
	- [ ] Search through history?
	- [ ] Provide history suggestions when typing in URL bar
- [ ] fetch API for hyperdrives [GH issue](https://github.com/cliqz-oss/dat-webext/issues/159)
	- [ ] Creating an archive (scoped to page origin)
	- [ ] PUT/DELETE methods for files / folders
	- [ ] Track created archives for origin in a DB
	- [ ] Access control prompt for writing to origin
- [ ] fetch API for IPFS (look at how their proxy works?)
- [x] WebXR - Make sure it's working!
- [ ] Web extension support via [electron-extensions](https://github.com/sentialx/electron-extensions)
	- [ ] Somewhere to render badges
	- [ ] Developer options page
	- [ ] Track extensions in a DB
	- [ ] Drag and drop extension folder
- [ ] Persist browser settings / history to Hyperdrive
- [ ] Load extensions from p2p protocols.
