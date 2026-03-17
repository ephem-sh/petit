---
title: Command
description: Package manager commands with tabbed interface
order: 3
---

# Command

Display package manager commands with automatic tabs. Supports any command and any combination of package managers.

## Usage

Use the `command` code fence. List the package managers after `command`. The content is the command to run.

````markdown
```command npm pnpm bun yarn
install @ephem-sh/petit
```
````

If no managers are specified, all common ones are shown:

````markdown
```command
add react react-dom
```
````

## Examples

### Install a package

```command npm pnpm bun yarn
install @ephem-sh/petit
```

### Run with npx

```command npx
@ephem-sh/petit dev
```

### Init with specific managers

```command npm pnpm bun
init
```

## API Reference

```type-table
# Command Properties
managers | string[] | npm, pnpm, bun, yarn | Package managers to show (space-separated after `command`)
command | string | required | The command to run (content of the code fence)
```
