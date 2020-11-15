# Supported protocols

- [x] `hyper://` [Hypercore](https://hypercore-protocol.org/)
  - Able to read from archives
  - Able to resolve `dat-dns` domains
  - Able to write, create and modify archives
- [x] `dat://`
  - Able to read from archives
  - Able to resolve `dat-dns` domains
  - No `DatArchive` support.
- [x] `gemini://` [Gemini](https://gemini.circumlunar.space/)
  - Able to read from gemini servers
  - Render Gemini pages as HTML
  - No certificate management code yet
- [x] ipfs
  - Able to read from `ipfs://` and `ipns://` URLs
  - Able to `POST` data into `IPFS`
  - Able to `PUBLISH` an infohash to IPNS
- [ ] [EarthStar](https://github.com/earthstar-project/earthstar)
- [ ] BitTorrent
- [ ] [Pigeon Protocol](https://tildegit.org/PigeonProtocolConsortium/protocol_spec)

PRs for more protocols are welcome.
