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
