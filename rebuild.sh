# Electron's version.
export npm_config_target=11.4.10
# The architecture of Electron, see https://electronjs.org/docs/tutorial/support#supported-platforms
# for supported architectures.
export npm_config_arch=x64
export npm_config_target_arch=x64
# Download headers for Electron.
export npm_config_disturl=https://electronjs.org/headers
# Tell node-pre-gyp that we are building for Electron.
export npm_config_runtime=electron
# Tell node-pre-gyp to build module from source code.
export npm_config_build_from_source=true
# Install all dependencies, and store cache to ~/.electron-gyp.
# HOME=~/.electron-gyp npm rebuild better-sqlite3
HOME=~/.electron-gyp electron-rebuild -v $(./node_modules/.bin/electron -v) -w better-sqlite3
