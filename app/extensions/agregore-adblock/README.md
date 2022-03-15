# Agregore-Adblock

A basic ad blocker extension for use in Chromium based web browsers.

## How it works

- Uses the ad blocklist from [This list](https://codeberg.org/spootle/blocklist/)
- Uses the [webRequest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest) API to intercept requests and cancel them if they're to a blocked domain.
