---
title: Type Table
description: API reference tables for type definitions
order: 5
updated: 2026-03-17
---

# Type Table

Display structured API reference tables for types, interfaces, or configuration options.

## Usage

Use the `type-table` code fence. Start with `# TypeName`, then list properties as `name | type | default | description`.

````markdown
```type-table
# PetitConfig
title | string | required | Site title
defaultScheme | "dark" \| "light" \| "system" | "system" | Default color scheme
toc | boolean | true | Show table of contents
maxWidth | "sm" \| "md" \| "lg" \| "xl" | "lg" | Content max width
```
````

## Example

```type-table
# PetitConfig
title | string | required | Site title
defaultScheme | "dark" \| "light" \| "system" | "system" | Default color scheme
schemeSwitcher | boolean | true | Show scheme toggle
toc | boolean | true | Show table of contents
maxWidth | "sm" \| "md" \| "lg" \| "xl" | "lg" | Content max width
repository | string | - | Repository URL for GitHub links
```

## API Reference

```type-table
# Row Format
name | string | required | Property name
type | string | required | Type annotation
default | string | required | Default value or `required` / `-`
description | string | required | Short description
```
