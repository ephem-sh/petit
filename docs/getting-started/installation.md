---
title: Installation
description: Set up a new documentation project with Petit
order: 2
updated: 2026-03-19
---

Petit requires Node.js 24 or later. It works with any project
regardless of language or framework.

## New project

Run the init command from your project root:

```command live
@ephem-sh/petit init
```

Petit asks for confirmation, then creates a config file and a
starter docs folder:

```
my-project/
  petit.config.json
  docs/
    getting-started/
      overview.md
```

The config file points directly to your content folders:

```json
{
  "title": "My Docs",
  "sidebar": [
    { "label": "Getting Started", "path": "./docs/getting-started" }
  ]
}
```

Start the dev server:

```command live
@ephem-sh/petit dev
```

Your docs are live at `http://localhost:4321`.

## Existing project

If you already have markdown files, generate just the config:

```command live
@ephem-sh/petit config
```

Then add your content folders to the sidebar. Each `path`
points directly to a folder containing `.md` files, relative
to the config:

```json
{
  "title": "My Docs",
  "sidebar": [
    { "label": "Guides", "path": "./docs/guides" },
    { "label": "API", "path": "./packages/core/docs" }
  ]
}
```

This works across monorepos too. You can pull documentation
from multiple locations in your project.

## Project structure

The config lives at your project root. Sidebar paths point
directly to folders with markdown:

```
my-project/
  petit.config.json
  src/
  docs/
    media/
      logo.png
    getting-started/
      overview.md
    guides/
      deployment.md
```

Images go in a `media/` folder inside your docs directory. See
the [media reference](/reference/media) for details.

## Package scripts

Add shortcuts to your `package.json`:

```json package.json
{
  "scripts": {
    "docs:dev": "npx @ephem-sh/petit dev",
    "docs:build": "npx @ephem-sh/petit build"
  }
}
```

## CLI reference

All commands run from your project root:

| Command | Description |
|---------|-------------|
| `npx @ephem-sh/petit init` | Create config + docs/ starter |
| `npx @ephem-sh/petit config` | Generate config file only |
| `npx @ephem-sh/petit dev` | Dev server with hot reload |
| `npx @ephem-sh/petit build` | Build static production site |
| `npx @ephem-sh/petit export` | Export as printable HTML |

`init` and `config` ask for confirmation before creating
files. Pass `--yes` to skip the prompt.
