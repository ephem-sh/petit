---
title: Command
description: Package manager commands with tabbed interface
order: 3
updated: 2026-03-17
---

Display package manager commands with automatic tabs. Supports any
command and any combination of package managers.

## Usage

Use the `command` code fence. List the package managers after `command`.
The content is the command to run, prefixed with each manager name.

````markdown
```command npm pnpm bun yarn
install @ephem-sh/petit
```
````

If no managers are specified, all four are shown (npm, pnpm, bun, yarn).

### Live mode

Add `live` after the managers to use package runners instead of managers.
This swaps npm for npx, bun for bun x, pnpm for pnpm dlx, and yarn for
yarn dlx.

````markdown
```command npm pnpm bun yarn live
@ephem-sh/petit dev
```
````

This renders tabs showing `npx @ephem-sh/petit dev`, `pnpm dlx @ephem-sh/petit dev`,
`bun x @ephem-sh/petit dev`, and `yarn dlx @ephem-sh/petit dev`.

## Examples

### Install a package

```command
install @ephem-sh/petit
```

### Run a package

```command live
@ephem-sh/petit dev
```

### Specific managers only

```command npm pnpm live
@ephem-sh/petit init
```

## API reference

```type-table
# Command properties
managers | string[] | npm, pnpm, bun, yarn | Package managers to show (space-separated after `command`)
live | flag | false | Use package runners (npx, bun x, pnpm dlx, yarn dlx) instead of managers
command | string | required | The command to run (content of the code fence)
```
