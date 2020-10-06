# Theming

Agregore provides CSS variables for themeing the browser at the URL `agregore://theme/vars.css`.

The contents of this look something like:

```css
:root {
  --ag-color-purple: #6e2de5;
  --ag-color-black: #111;
  --ag-color-white: #F2F2F2;
  --ag-color-green: #2de56e;
}

:root {
  --ag-theme-font-family: system-ui;
  --ag-theme-background: var(--ag-color-black);
  --ag-theme-text: var(--ag-color-white);
  --ag-theme-primary: var(--ag-color-purple);
  --ag-theme-secondary: var(--ag-color-green);
}
```

These can be imported anywhere you'd like to use browser styling.

Specifically, you should try to use the `--ag-theme-*` variables for the page when possible.

You can also make use of the `agregore://theme/style.css` which adds some default styling to stuff like headers, the background/text colors, and links.

This is useful for styling markdown pages or other pages with basic HTML. You probably shouldn't include this if you're doing something fancy with styling as the styles may change over time.

The style includes a class called `agregore-header-anchor` which can be used on anchors within headers for linking to headings. Checkout the markdown extension 

## Customization

The `--ag-theme-*` variables can me modified in the `.agregorerc` file by clicking `Help > Edit Configuration File` and adding the following content:

```
{
  "theme": {
    "font-family": "system-ui",
    "background": "var(--ag-color-black)",
    "text": "var(--ag-color-white)",
    "primary": "var(--ag-color-purple)",
    "secondary": "var(--ag-color-green)"
  }
}
```

You can replace the various values with any valid CSS values like Hex codes: `#FFAABB`, or `rgb()`.

More styles will be added here as needed. If you feel we should standardize on some sort of style, feel free to open an issue talking about what it is and why it should be added.

## Highlight.js

For convenience, Agregore bundles [highlight.js](https://highlightjs.org/) and a default theme for it.

You can load it up using `agregore://theme/highlight.js` and `agregore://theme/highlight.css`.
