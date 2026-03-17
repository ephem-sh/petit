---
title: Configuration
description: Configure your Petit documentation site
order: 3
---

The `petit.config.json` file controls your site's appearance,
navigation, and features. It lives in your docs directory,
alongside your category folders.

## Full example

Here is a config file using every available option:

```json
{
  "title": "My Project",
  "logo": "/logo.png",
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "siteUrl": "https://docs.example.com",
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
    { "label": "Getting Started", "path": "./getting-started" },
    { "label": "API Reference", "path": "./api" },
    { "label": "Examples", "path": "./examples" }
  ]
}
```

Only `title` is required. Everything else has sensible defaults.

## Options

```type-table
# PetitConfig
title | string | required | Site title in the sidebar header
logo | string | - | Logo image path, relative to config file
repository | string | - | GitHub URL, adds "Edit on GitHub" links
branch | string | "main" | Git branch for "Edit on GitHub" links
siteUrl | string | - | Production URL, enables SEO (sitemap, OG images, llms.txt)
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

Each sidebar entry has a `label` and an optional `path`. Entries
with a `path` scan that folder for `.md` files. Entries without
a `path` are non-clickable section headers.

```json
{
  "sidebar": [
    { "label": "Getting Started", "path": "./getting-started" },
    { "label": "Reference" },
    { "label": "Core", "path": "./reference/core" },
    { "label": "Plugins", "path": "./reference/plugins" }
  ]
}
```

"Reference" here is a visual divider. "Core" and "Plugins" each
list the pages found in their directories.

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
