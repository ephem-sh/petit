---
title: Configuration
description: Configure your Petit documentation site
order: 3
---

The `petit.config.json` file controls your site's appearance,
navigation, and features. It lives at your project root.

## Full example

Here is a config file using every available option:

```json
{
  "title": "My Project",
  "logo": "logo.png",
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "siteUrl": "https://docs.example.com",
  "deploy": "node",
  "defaultScheme": "dark",
  "schemeSwitcher": true,
  "theme": "default",
  "fonts": {
    "sans": "Inter",
    "mono": "JetBrains Mono"
  },
  "maxWidth": "lg",
  "sidebarPosition": "left",
  "toc": true,
  "sidebar": [
    { "label": "Getting Started", "path": "./docs/getting-started" },
    { "label": "API Reference", "path": "./docs/api" },
    { "label": "Examples", "path": "./docs/examples" }
  ]
}
```

Only `title` is required. Everything else has sensible defaults.

## Options

```type-table
# PetitConfig
title | string | required | Site title in the sidebar header
logo | string | - | Logo filename, resolved from media directory
mediaDir | string | auto | Path to media/images directory, relative to config
repository | string | - | GitHub URL, adds "Edit on GitHub" links
branch | string | "main" | Git branch for "Edit on GitHub" links
siteUrl | string | - | Production URL, enables SEO (sitemap, OG images, llms.txt)
deploy | "node" \| "cloudflare" \| "netlify" \| "vercel" \| "bun" | "node" | Deploy target platform (see deployment guide)
defaultScheme | "dark" \| "light" \| "system" | "system" | Color scheme on first visit
schemeSwitcher | boolean | true | Show the light/dark toggle
theme | string | "default" | Theme preset for colors and fonts
themeOverrides | ThemeConfig | - | Override CSS variables per color scheme
fonts | { sans?: string, mono?: string } | - | Custom Google Fonts for body and code text
maxWidth | "sm" \| "md" \| "lg" \| "xl" | "lg" | Content area max width
sidebarPosition | "left" \| "right" \| "center" | "left" | Sidebar placement
toc | boolean | true | Show "On this page" table of contents
sidebar | SidebarItem[] | [] | Navigation structure (see below)
```

## Sidebar

Each sidebar entry has a `label` and an optional `path`. Paths
point directly to folders containing `.md` files, relative to
the config file:

```json
{
  "sidebar": [
    { "label": "Getting Started", "path": "./docs/getting-started" },
    { "label": "Reference" },
    { "label": "Core", "path": "./docs/reference/core" },
    { "label": "Plugins", "path": "./docs/reference/plugins" }
  ]
}
```

"Reference" here is a visual divider. "Core" and "Plugins" each
list the pages found in their directories.

In a monorepo you can pull docs from multiple locations:

```json
{
  "sidebar": [
    { "label": "Getting Started", "path": "./docs/getting-started" },
    { "label": "Core API", "path": "./packages/core/docs" },
    { "label": "CLI", "path": "./packages/cli/docs" }
  ]
}
```

For page ordering, URL generation, frontmatter fields, and draft
pages, see the [routing reference](/reference/routing).

## Themes

Petit ships with 18 built-in themes. Set the `theme` option
in your config:

```json
{
  "theme": "claude"
}
```

See the [themes reference](/reference/themes) for the full list,
live previews, and customization options.
