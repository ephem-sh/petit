---
title: Cards
description: Display linked content as a grid of cards
order: 1
updated: 2026-03-17
---

# Cards

A grid of clickable cards for navigation or feature highlights.

## Usage

Use the `cards` code fence. Each card is defined with `# Title`, a description line, and an optional link (line starting with `/`).

````markdown
```cards
# Getting Started
Learn the basics of Petit
/getting-started/overview

# Configuration
Set up your project config
/getting-started/configuration

# Markdown
Write beautiful documentation
/reference/markdown
```
````

## Example

```cards
# Getting Started
Learn the basics of Petit
/getting-started/overview

# Configuration
Set up your project config
/getting-started/configuration

# Markdown
Write beautiful documentation
/reference/markdown
```

## API Reference

```type-table
# Card Properties
title | string | required | Card heading (from `# Title` line)
description | string | - | Description text (first line after title)
href | string | - | Link URL (line starting with `/`)
```
