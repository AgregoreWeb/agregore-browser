# Installing extensions

Agregore doesn't yet support loading extensions from app stores or zip files, but you can place the extracted extensions inside a folder for it to load.

Click on `Help > Open Extension Folder` in the application menu on any window to open up your extensions folder.

You can drop folders in here to have them load when Agregore starts up.

For a list of APIs that are supported, please look at the [Electron Extensions](https://github.com/sentialx/electron-extensions/issues/14) module.

Agregore comes with two built-in extensions. A basic ad blocker, and the history tracking extension.

You can change the location of your extensions folder by editing your `.agregorerc` config file.

This can be done by clicking `Help > Edit Configuration File`, then adding in the following contents:

```json
{
  "extensions": {
    "dir": "/your/extensions/folder/here"
  }
}
```
