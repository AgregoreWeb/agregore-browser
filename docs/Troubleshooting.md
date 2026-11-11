# Troubleshooting

## Electron sandbox issue on Linux

On some Linux distros you can get the following error when running `start`:

```
[2720:0425/142001.775056:FATAL:setuid_sandbox_host.cc(157)] The SUID sandbox helper binary was found, but is not configured correctly. Rather than run without sandboxing I'm aborting now. You need to make sure that /path/to/agregore/node_modules/electron/dist/chrome-sandbox is owned by root and has mode 4755.
```

The simplest solution is to change the permissions on the `chrome-sandbox` binary, as stated in the error:

```
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

Note that it is important to run these commands *in that order*, otherwise it won't work. You might also run into further permission issues when trying to update the project dependencies.

If your distro supports it, the following might work as a more permanent solution:

```
sudo sysctl kernel.unprivileged_userns_clone=1
```

If the solutions above don't work for some reason, you can always run Electron with the `--no-sandbox` flag, although this is definitely [not recommended](https://www.electronjs.org/docs/api/sandbox-option) when loading untrusted web content.

## `npm install` issues

### Electron binary missing or incomplete

If the app fails to start after installing dependencies, complaining about a missing Electron executable, the Electron post-install download was likely interrupted. Re-run it with:

```
node node_modules/electron/install.js
```

If `node_modules/electron/dist` is still incomplete (e.g. only contains a licenses file), extract the cached zip manually:

```
cd node_modules/electron
rm -rf dist && mkdir dist
cd dist && unzip "$HOME/Library/Caches/electron/"*/electron-v*.zip
cd .. && printf 'Electron.app/Contents/MacOS/Electron' > path.txt
```

On Linux/Windows, replace the last line's path with `electron` or `electron.exe` respectively, matching the archive contents.

### Install scripts gated by npm

npm 11.20 and newer gate dependency install scripts. If a package's post-install did not run (for example the `kubo` binary is missing from `node_modules/kubo/kubo/ipfs`), review the gated scripts with:

```
npm install-scripts ls
```

Approve the ones the project needs with:

```
npm install-scripts approve <package>
```

Note the `kubo` package downloads its binary on first use when the post-install was skipped, so a gated `kubo` post-install is not fatal.
