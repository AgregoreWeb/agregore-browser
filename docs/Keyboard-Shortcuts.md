# Configuring keyboard shortcuts

Agregore uses the [rc](https://www.npmjs.com/package/rc#standards) module for loading configuration.

There's a bunch of functionality in there, but the short of it is that you can use the following as a starting point for your configuration.

Save this as a file called `.agregorerc` in your "home" or "user" folder. 

You can open this file by navigating to `Help > Edit Configuration File`.

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
    "HardReload": "CommandOrControl+Shift+R"
  }
}
```

The accelerators section maps names of actions to [keyboard shortcuts](https://www.electronjs.org/docs/api/accelerator).

You can set these to whatever you want and it will override the defaults listed above.

Check out `app/actions.js` for a full list of action names since some of them don't have keyboard shortcuts by default.
