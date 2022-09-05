
# config

All ssb options here: <https://github.com/ssbc/ssb-config#configuration>

## default config

Agregore has this default configuration:

```js
  ssbOptions: {
    appname: 'agregore-ssb',
    ssbd: {
      runServer: true,
      plugins: require('@metacentre/shipyard-ssb')
    }
  },
```

The ssb data directory resides at `~/.agregore-ssb`

## custom config

Custom configuration can be set in `~/.agregorerc`

The ssb data directory can be changed by altering `appname`.

To connnect to a different ssb-server, set `runServer` to false. For example:

```json
{
  "ssbOptions": {
    "ssbd": {
      "appname": "ssb",
      "runServer": false
    }
  }
}
```

In this case `ssb-fetch` will connect to the server configured at `~/.ssb`

## ssb_appname env var

If agregore is run in an environment with `ssb_appname` set, `ssb-fetch` will use config in that directory.

For example, from the root directory of agregore:

```sh
ssb_appname=ssb-test yarn start
```

will use config at `~/.ssb-test/config`

# plugins

## default plugins list

ssb functionality is provided by [Secret-Stack muxrpc plugins](https://github.com/ssbc/secret-stack/blob/main/PLUGINS.md). Agregore bundles [`ssbd` an ssb daemon](https://github.com/av8ta/ssbd) with a default selection of plugins preinstalled.

## custom plugins list

Custom plugins can optionally be specified in `~/.agregorerc` instead. An absolute path is necessary.

```json
{
  "ssbOptions": {
    "ssbd": {
      "plugins": ["/absolute/path/to/list/of/plugins/to/require"]
    }
  },
}
```

The list of plugins is a module exporting an array of require'd ssb plugins. Below is an example from [shipyard-ssb](https://github.com/metacentre/shipyard-ssb):

```js
module.exports = [
  require('ssb-db'),
  require('ssb-master'),
  require('ssb-private1'),
  require('ssb-onion'),
  require('ssb-unix-socket'),
  require('ssb-no-auth'),
  require('ssb-gossip'),
  require('ssb-replicate'),
  require('ssb-friends'),
  require('ssb-blobs'),
  require('ssb-invite'),
  require('ssb-local'),
  require('ssb-logging'),
  require('ssb-query'),
  require('ssb-links'),
  require('ssb-ws'),
  require('ssb-ebt'),
  require('ssb-ooo'),
]
```

## user supplied override plugins

`ssbd` uses `ssb-plugins` under the hood as another way to specify plugins. These plugins will override the plugins above. They are [installed manually](https://github.com/ssbc/ssb-plugins#installing-a-user-configured-ssb-plugin-manually) to the node_modules directory in the ssb data directory. Historically in `~/.ssb/node_modules/`. In the case of agregore, in `~/.agregore-ssb/node_modules/`.

# config scenarios in ~/.agregorerc

Run bundled `ssbd` with *bundled* plugins. Data dir `~/.agregore-ssb`

```json
{
  "ssbOptions": {
    "ssbd": {
      "runServer": true
    }
  }
}
```

Run bundled `ssbd` with *custom* plugins. Data dir `~/.agregore-ssb`

Note the absolute path to plugins

```json
{
  "ssbOptions": {
    "ssbd": {
      "runServer": true,
      "plugins": ["/home/av8ta/.agregore-plugins/index.js"]
    }
  }
}
```

Run bundled `ssbd` with *bundled* plugins. With previously existing data dir `~/.ssb`

```json
{
  "ssbOptions": {
    "appname": "ssb",
    "ssbd": {
      "runServer": true
    }
  }
}
```

Do *not bundle* `ssbd`. Connect to running ssb-server. Data dir `~/.ssb`

```json
{
  "ssbOptions": {
    "appname": "ssb",
    "ssbd": {
      "runServer": false
    }
  }
}
```

Do *not bundle* `ssbd`. Attempt to pass through config & connect to running ssb-server. Data dir `~/.ssb`

```json
{
  "ssbOptions": {
    "appname": "ssb",
    "npm": {
      "port": 8043
    },
    "ssbd": {
      "runServer": false
    }
  }
}
```

The npm port config here has no effect because agregore is unable to configure an already running ssb server. In cases like this, place your ssb config in the appropriate file.

In `~/.agregorerc`

```json
{
  "ssbOptions": {
    "appname": "ssb",
    "ssbd": {
      "runServer": false
    }
  }
}
```

In `~/.ssb/config`

```json
{
  "npm": {
    "port": 8043
  }
}
```
