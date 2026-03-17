---
title: Installation
description: Set up a new documentation project with Petit
order: 2
---

## New project

Run `petit init` from your project root. It creates a `docs/`
folder with a config file and a starter page:

```bash
npx @ephem-sh/petit init
```

This produces:

```
my-project/
  docs/
    petit.config.json
    getting-started/
      overview.md
```

Then start the dev server:

```bash
cd docs && npx @ephem-sh/petit dev
```

Your docs are live at `http://localhost:4321`.

## Existing docs

If you already have markdown files, generate just the config:

```bash
npx @ephem-sh/petit config
```

This creates `petit.config.json` in the current directory with
an empty sidebar. Add your folders to it:

```json
{
  "title": "My Docs",
  "sidebar": [
    { "label": "Guides", "path": "./guides" },
    { "label": "API", "path": "./api" }
  ]
}
```

You can also specify a custom path:

```bash
npx @ephem-sh/petit config --path ./documentation
```

## Project structure

The config file lives alongside your category folders. This is
the structure Petit expects:

```
docs/
  petit.config.json
  getting-started/
    overview.md
    installation.md
  guides/
    deployment.md
  reference/
    api.md
```

Each folder is a category. Each `.md` file inside is a page.
The sidebar `path` values in your config point to these folders,
relative to the config file.

> **Note:** Only put the config at your repo root if the entire
> repository is documentation. For most projects, use a `docs/`
> subfolder.

## Running commands

Petit commands must run from the directory containing your
config file:

```bash
cd docs
npx @ephem-sh/petit dev
npx @ephem-sh/petit build
```

You can add shortcuts to your `package.json`:

```json package.json
{
  "scripts": {
    "docs:dev": "cd docs && npx @ephem-sh/petit dev",
    "docs:build": "cd docs && npx @ephem-sh/petit build"
  }
}
```

## CLI reference

| Command | Description |
|---------|-------------|
| `npx @ephem-sh/petit init` | Create docs/ with config and starter page |
| `npx @ephem-sh/petit config` | Generate config file only |
| `npx @ephem-sh/petit dev` | Dev server with hot reload |
| `npx @ephem-sh/petit build` | Build static production site |
| `npx @ephem-sh/petit export` | Export docs as printable HTML |
