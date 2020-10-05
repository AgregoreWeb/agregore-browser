# Agregore Browser
A minimal web browser for the distributed web

<p align="center" style="float: right">
	<img src="./build/icon.png" width="333px">
</p>

[![Build Status](https://travis-ci.com/RangerMauve/agregore-browser.svg?branch=master)](https://travis-ci.com/RangerMauve/agregore-browser)  
[Watch the intro video](https://www.youtube.com/watch?v=TnYKvOQB0ts&list=PL7sG5SCUNyeYx8wnfMOUpsh7rM_g0w_cu&index=14)  
[Download the installer](https://github.com/RangerMauve/agregore-browser/releases)  
[Discord](https://discord.gg/QMthd4Y)  

## Goals

- Enable people to make and use local first apps using the web
- Be minimal (fewer built-in features, leave more to the OS)
- Be open to anything p2p / decentralized / local-first
- Rely on web extensions for extra functionality
- Work with mesh networks / Bluetooth Low Energy networks

![Agregore demo](agregore-demo-2.gif)

## Features / Keyboard shortcuts

- Navigate web pages (back and forward with `ctrl+[` and `ctrl+]`)
- Open multiple windows (`ctrl+n`)
- Open links in new windows (right click on element)
- Basic navigation bar (`ctrl+l` to bring into focus)
- Find text on the page (`ctrl+f` to bring into focus, `esc` to hide)
- Dev tools (`ctrl+shift+i`)
- Autocomplete URLs from history (type in the URL bar, up/down to navigate, right to autocomplete)
- Persist open windows when quitting
- Web Extension support
- Save files from pages (any protocol, right click it)
- Set as default browser (click Set As Default in the Help menu)

## Docs

Check out the [documentation](./docs).

## Contributing

Feel free to open a Github issue if you wish to tackle one of the items on the roadmap, or message @RangerMauve directly on whatever platform you can find them on.

This project uses the [StandardJS](https://standardjs.com/) code style. Please format your code with `standard --fix` or run `npm run lint`.

To build from source do the following:

- Set up node.js, git, and yarn
- Clone the repo
- `yarn`
- `yarn start`
