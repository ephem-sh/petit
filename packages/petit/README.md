# @ephem-sh/petit

Small, fast, local-first documentation. Markdown in, static site out.

- **Zero config to start** - Point at a folder of markdown files and go
- **Full-text search** - Client-side search powered by Orama, no server needed
- **18 themes** - Default, Claude, Vercel, Supabase, and 14 more
- **10 components** - Tabs, cards, steps, callouts, accordions, type tables, diagrams, command tabs, code blocks, video embeds
- **SEO ready** - Sitemap, OG images, meta tags, JSON-LD, canonical URLs
- **AI ready** - Auto-generated llms.txt, llms-full.md, and per-page .md endpoints
- **Dark mode** - System, light, dark with theme-aware images and logos
- **Math** - KaTeX for inline and block equations
- **Fast** - Vite-powered dev server with hot reload, static build output

## Quick start

```bash
npx @ephem-sh/petit init
npx @ephem-sh/petit dev
```

This creates a `petit.config.json` and a starter doc, then opens a dev server at `localhost:4321`.

## Configuration

```json
{
  "title": "My Docs",
  "theme": "default",
  "sidebar": [
    { "label": "Guide", "path": "./docs/getting-started" },
    { "label": "Reference", "path": "./docs/reference" }
  ]
}
```

See [configuration docs](https://petit.ephem.sh/docs/getting-started/configuration) for all options.

## CLI

| Command | Description |
|---------|-------------|
| `npx @ephem-sh/petit init` | Scaffold config and starter docs |
| `npx @ephem-sh/petit dev` | Dev server with hot reload |
| `npx @ephem-sh/petit build` | Static production build |
| `npx @ephem-sh/petit export` | Export as single printable HTML |

## Components

Write components using fenced code blocks with special language names:

````markdown
```install
@ephem-sh/petit
```

```steps
# Create your docs
Write markdown files in a folder.

# Configure
Add a petit.config.json pointing to your docs.

# Ship it
Run the build command and deploy anywhere.
```

```tabs
# React
npm install react

# Vue
npm install vue
```

> [!NOTE]
> Callouts support NOTE, TIP, INFO, WARNING, and DANGER types.
````

Full component reference at [petit.ephem.sh](https://petit.ephem.sh/docs/reference/markdown).

## Themes

18 built-in themes: `default`, `2077`, `amber`, `burgundy`, `claude`, `deep`, `ghibli`, `itadori`, `offworld`, `pine`, `starbucks`, `stella`, `supabase`, `supra`, `t3chat`, `vercel`, `void`, `zen`

```json
{
  "theme": "claude"
}
```

Override any CSS variable per color scheme:

```json
{
  "theme": "default",
  "themeOverrides": {
    "dark": {
      "custom": {
        "primary": "oklch(0.7 0.15 250)"
      }
    }
  }
}
```

## Frontmatter

```yaml
---
title: Page title
description: Meta description for search and SEO
order: 1
draft: true
---
```

## SEO and AI

Set `siteUrl` in your config to enable:

- `sitemap.xml` and `robots.txt`
- OG images (1200x630 PNG, auto-generated per page)
- `llms.txt` and `llms-full.md` for AI consumption
- Per-page `.md` endpoints

## Documentation

Full docs at [petit.ephem.sh](https://petit.ephem.sh)

## License

MIT
