# Bookmarks

Bookmarks are stored as files. If you wish to specify the path to agregore set the `appPath` property in your `.agregorerc` config file. You may need to do this if you've moved an agregore AppImage to `/usr/bin` for example.

This can be done by pressing `ALT` to bring up the menu and then clicking `Help > Edit Configuration File`, then adding in the following contents:

```json
{
  "appPath": "/usr/bin/or/wherever/agregore-browser"
}
```