# Configuring the default web search provider

By default, Agregore uses DuckDuckGo's **no-AI** search endpoint for web searches, with a URI template of:

```text
https://noai.duckduckgo.com/?ia=web&q=%s
```

The `%s` in the template is replaced with your search query.

## Available Search Providers

Agregore includes the following privacy-focused search providers in the settings page:

- **DuckDuckGo (No AI)** - `https://noai.duckduckgo.com/?ia=web&q=%s`
- **DuckDuckGo (With AI)** - `https://duckduckgo.com/?ia=web&q=%s`
- **Brave Search** - `https://search.brave.com/search?q=%s`
- **Startpage** - `https://www.startpage.com/do/dsearch?query=%s`
- **SearX (searx.be)** - `https://searx.be/?q=%s`
- **SearXNG (disroot)** - `https://search.disroot.org/?q=%s`
- **Ecosia** - `https://www.ecosia.org/search?q=%s`
- **Mojeek** - `https://www.mojeek.com/search?q=%s`
- **Kagi** - `https://www.kagi.com/search?q=%s`
- **Gibiru** - `https://www.gibiru.com/?q=%s`
- **ArtadoSearch** - `https://www.artadosearch.com/search?Button1=Artado&i=%s`

## Changing the Search Provider

You can change the search provider in two main ways:

- Via the **Settings page** at `agregore://settings`:
  - Use the **Search Provider URI Template** field with a **datalist** dropdown containing all the privacy-focused search providers listed above.
  - Simply select from the dropdown or type a custom search URL template containing `%s`.
- By editing your `.agregorerc` configuration file directly and setting the `searchProvider` field to your preferred template.

## Adding Custom Search Providers

To add a custom search provider, simply enter the URL template in the Search Provider URI Template field. The template must contain `%s` where the search query should be inserted. For example:

- Google: `https://www.google.com/search?q=%s`
- Bing: `https://www.bing.com/search?q=%s`
- Custom engine: `https://your-search-engine.com/search?query=%s`

