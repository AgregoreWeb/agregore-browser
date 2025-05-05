# Theming

Agregore provides CSS variables for theming the browser at the URL `browser://theme/vars.css`.

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

You can also make use of the `browser://theme/style.css` which adds some default styling to stuff like headers, the background/text colors, and links.

This is useful for styling markdown pages or other pages with basic HTML. You probably shouldn't include this if you're doing something fancy with styling as the styles may change over time.

The style includes a class called `agregore-header-anchor` which can be used on anchors within headers for linking to headings. Checkout the markdown extension 

## Customization

The `--ag-theme-*` variables can be modified in the `.agregorerc` file by clicking `Help > Edit Configuration File` and adding the following content:

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

## Syntax Highlighting Font

Agregore now uses a custom font for syntax highlighting in code blocks. The font file is located at `browser://theme/FontWithASyntaxHighlighter-Regular.woff2`.

To use this font for `code` elements, you can include the following CSS in your stylesheet:

```css
@font-face {
  font-family: 'FontWithASyntaxHighlighter';
  src: url('browser://theme/FontWithASyntaxHighlighter-Regular.woff2') format('woff2');
}

code {
  font-family: 'FontWithASyntaxHighlighter', monospace;
}
```

This font provides built-in syntax highlighting for code blocks, making it easier to read and understand code snippets.

## Theme Protocol (`browser://theme/`)

### Overview

The `browser://theme/` protocol provides a standardized way for web applications to access browser-level CSS styles and theme variables in Agregore and other compatible browsers, such as [Peersky](https://peersky.p2plabs.xyz/). This protocol ensures consistent theming across different browsers by serving CSS files with a common set of variables based on the [Base16 theme framework](https://github.com/chriskempson/base16). It allows developers to build applications that adapt to the browser's theme without needing browser-specific code, making it suitable for any browser that implements the protocol.

### Purpose

The goal of the `browser://theme/` protocol is to:

- Enable cross-browser compatibility for theming in any browser, including innovative browsers like Agregore and Peersky.
- Provide a unified set of theme variables using Base16 conventions, complementing Agregore’s existing `--ag-theme-*` variables.
- Allow web applications to import styles or variables without hardcoding browser-specific protocols (e.g., `agregore://` or `peersky://`).

### Implementation

#### Protocol Handler

The `browser://theme/` protocol is implemented in Agregore via a custom Electron protocol handler (`theme-handler.js`). It serves CSS files from the `pages/theme/` directory when requests are made to URLs like `browser://theme/vars.css` or `browser://theme/style.css`.

- **Location**: Files are stored in `pages/theme/` (e.g., `vars.css`, `style.css`).
- **URL Structure**: Requests to `browser://theme/<filename>` map to `pages/theme/<filename>`.
- **Example**: `browser://theme/vars.css` serves `pages/theme/vars.css`.

#### Base16 Integration

To ensure cross-browser compatibility, the theme protocol uses the Base16 theme framework, which defines 16 color variables (`--base00` to `--base0F`). These variables are declared in `vars.css` alongside Agregore’s existing theme variables.

- **Variables**: `vars.css` defines:
  - `--base00` to `--base07`: Core UI colors (backgrounds, text, etc.).
  - `--base08` to `--base0F`: Accent colors for highlights or interactive elements.
- **Component Variables**: Agregore-specific variables (e.g., `--ag-theme-background`) are defined in terms of Base16 variables for consistency (e.g., `--ag-theme-background: var(--base00);`). Peersky-specific variables (e.g., `--peersky-background-color`) are also supported for cross-browser apps.

### Cross-Browser Compatibility

The `browser://theme/` protocol enables apps built for Peersky to work seamlessly in Agregore (and vice versa) by:

1. **Standardized Protocol**: Both browsers implement `browser://theme/` to serve their theme CSS files.
2. **Base16 Variables**: Apps can use Base16 variables (e.g., `--base00`) directly or map browser-specific variables (e.g., `--peersky-background-color`) to Base16 variables. For example:
   - In Peersky: `--peersky-background-color: var(--base00);`
   - In Agregore: `--base00: #111111;`
   - Result: A Peersky app using `--peersky-background-color` renders with Agregore’s `--base00` color (`#111111`).
3. **Fallbacks**: Apps can import `browser://theme/vars.css` to ensure all Base16 and browser-specific variables are available.

This approach ensures that apps adapt to the host browser’s theme without requiring separate stylesheets for each browser.

### Usage

In addition to Agregore’s existing `--ag-theme-*` variables, developers can use Base16 variables for broader compatibility. Examples:

- **Import Variables with Base16**:
  ```html
  <style>
    @import url("browser://theme/vars.css");
    body {
      background-color: var(--base00); /* Maps to --ag-theme-background */
      color: var(--base05); /* Maps to --ag-theme-text */
    }
  </style>
  ```

- **Use Peersky Variables in Agregore**:
  ```html
  <style>
    @import url("browser://theme/vars.css");
    body {
      background-color: var(--peersky-background-color); /* Maps to --base00 in Agregore */
    }
  </style>
  ```

### Available Files

- `browser://theme/vars.css`: Defines Base16 variables (`--base00` to `--base0F`), Agregore-specific variables (e.g., `--ag-theme-background`), and Peersky-specific variables for compatibility.
- `browser://theme/style.css`: Provides default styles for web apps, importing `vars.css` and applying Base16 and Agregore variables.
- `browser://theme/FontWithASyntaxHighlighter-Regular.woff2`: Custom font for syntax highlighting (see Syntax Highlighting Font section).

### Customization

Agregore’s theme variables can still be customized via the `.agregorerc` file, as described above. To align with Base16, you can specify colors that match the Base16 palette (e.g., setting `"background": "#111111"` to match `--base00`).

### Development Guidelines

- **Use Base16 Variables**: Prefer Base16 variables (e.g., `--base00`) for new styles to ensure cross-browser compatibility.
- **Add New Files**: Place additional CSS files in `pages/theme/` to make them accessible via `browser://theme/<filename>`.
- **Test Cross-Browser**: Verify apps work in both Agregore and Peersky, checking that variables like `--peersky-background-color` render correctly.
- **Update Documentation**: Modify this file if new theme files or variables are added.
