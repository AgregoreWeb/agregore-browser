# Agregore Browser
A minimal web browser for the distributed web

<p align="center" style="float: right">
	<img src="./build/icon.png" width="333px">
</p>

[![Build Status](https://travis-ci.com/RangerMauve/agregore-browser.svg?branch=master)](https://travis-ci.com/RangerMauve/agregore-browser)  

[Overview from SpeakeasyJS](https://www.youtube.com/watch?v=ciRWmEhL8e8)

[Watch the intro video from Dat Conference](https://www.youtube.com/watch?v=TnYKvOQB0ts&list=PL7sG5SCUNyeYx8wnfMOUpsh7rM_g0w_cu&index=14)  

[Intro to IPFS interface from IPFS meetup](https://youtu.be/kI9Issf3MNc?t=1606)

[5 minute overview from Dweb meetup](https://archive.org/embed/dweb-meetup-dec-2020-dweb-lightning-talks?start=4212)

[Download the installer](https://github.com/RangerMauve/agregore-browser/releases)  

[Discord](https://discord.gg/QMthd4Y)  

## Goals

- Enable people to make and use local first apps using the web
- Be minimal (fewer built-in features, leave more to the OS)
- Be open to anything p2p / decentralized / local-first
- Rely on web extensions for extra functionality
- Work with mesh networks / Bluetooth Low Energy networks

![Agregore demo](agregore-demo-2.gif)

## Features

### Keyboard Shortcuts
(Ctrl means Command or Control)
|Shortcut|Does|Is configurable|
|:-:|:-:|:-:|
|Alt|Show Menu Bar|-|
|Ctrl+N|New Window|+|
|F11|Fullscreen|-|
|Ctrl+M|Minimize|-|
|Ctrl+W|Close|-|
|Ctrl+Shift+I|Open Devtools|+|
|Ctrl+]|Navigate Forward|+|
|Ctrl+\[|Navigate Backward|+|
|Ctrl+L|Focus URL Bar|+|
|Ctrl+F|Find in page|-|
|Ctrl+R|Reload|+|
|Ctrl+Shift+R|Hard Reload|+|
||Learn More|+|
||Open Extensions Folder|+|
|Ctrl+.|Edit Config File|+|

### Other features
- Open links in new windows (right click on element)
- Find text on the page (`ctrl+f` to bring into focus, `esc` to hide)
- Autocomplete URLs from history (type in the URL bar, up/down to navigate, right to autocomplete)
- Persist open windows when quitting
- Web Extension support
- Save files from pages (any protocol, right click it)
- Set as default browser (click Set As Default in the menu bar (`ALT`))

## Docs

Check out the [documentation](./docs).

## Contributing

Feel free to open a Github issue if you wish to tackle one of the items on the roadmap, or message @RangerMauve directly on whatever platform you can find them on.

This project uses the [StandardJS](https://standardjs.com/) code style. Please format your code with `standard --fix` or run `npm run lint`.

To build from source do the following:

- Set up node.js, git, and yarn
- Clone the repo
- Pull your clone
- Load submodules with `git submodule update --init --recursive`
- Run `yarn` or `npm install`
- Run `yarn start` or `npm start`
- After coding, when ready to submit, run `standard --fix` or `npm run lint`
- Push to your clone
- Submit a pull request

Other notes:
- To debug extensions, run `yarn debug`
