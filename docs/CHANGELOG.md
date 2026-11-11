# Changelog

## [Unreleased] - 2026-11-11

Modernized the dependency tree on Node 26 (`npm install` was failing and several direct dependencies were deprecated or missing).

### Fixed

- `npm install` failing in the `go-ipfs` post-install: the deprecated `go-ipfs` npm package downloaded its binary from `dist.ipfs.tech`, which is unreachable from many networks. The `kubo` npm package replaces it and downloads binaries from GitHub releases instead.
- `src/localsites.js` crashing at boot: it imports `rocksdb-native`, which was never declared in `package.json`.
- Kubo daemon config in `src/config.js` using removed/renamed keys: `/quic` (draft-29) is gone from modern kubo and now `/quic-v1`; `Ipns.UsePubsub` renamed to `Ipns.UsePubSub`; js-ipfs-only options (`silent`, `preload`) removed; API CORS headers restored (previously applied by ipfsd-ctl defaults).

### Changed

- IPFS stack modernized (commit `127000b`):
  - `go-ipfs` → `kubo` ^0.43.1
  - `ipfs-http-client` → `kubo-rpc-client` ^7.0.0
  - `ipfsd-ctl` ^13.0.0 → ^17.0.0 (`src/protocols/ipfs-protocol.js` migrated to the v17 `createNode` API)
- `compact-encoding` 2.18 → ^3.6.0
- `delay` ^6.0.0 → ^7.0.0
- `p-queue` ^7.3.4 → ^10.0.0
- `mime` ^2.4.6 → ^4.1.2
- `fs-extra` ^9.0.1 → ^11.4.1
- `@roamhq/wrtc` ^0.8.0 → ^0.10.0
- `bt-fetch` ^3.1.1 → ^3.3.3
- `hyper-sdk` ^6.2.1 → ^6.2.2
- `web3protocol` ^0.6.2 → ^0.6.3

### Removed

- `abort-controller` (unused; Node has a global `AbortController`)
- `data-uri-to-buffer` (unused)
- `gemini-to-html` (unused)

### Notes

- `multiformats` stays at ^9.9.0: `src/ui/omni-box.js` loads it with CJS `require` in the renderer, and v10+ is ESM-only.
- Deprecated-but-latest (no newer release exists without an architectural rewrite): `js-ipfs-fetch` (Helia migration), `hyper-sdk` 6, `ssb-fetch`, `web3protocol`.
- If `node_modules/electron/dist` is ever incomplete after install (post-install extraction interrupted), repair it with:

```bash
cd node_modules/electron
rm -rf dist && mkdir dist
cd dist && unzip ~/Library/Caches/electron/*/electron-v*.zip
cd .. && printf 'Electron.app/Contents/MacOS/Electron' > path.txt
```

- npm 11.20+ gates install scripts; review with:

```bash
npm install-scripts ls
```
