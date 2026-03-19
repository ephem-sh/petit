---
title: Tabs
description: Tabbed content panels
order: 7
updated: 2026-03-16
---

# Tabs

Switch between different content panels. Useful for showing framework-specific examples.

## Usage

Use the `tabs` code fence. Each `# Label` creates a tab.

````markdown
```tabs
# React
Use the React adapter for your project.

# Vue
Use the Vue adapter for your project.

# Svelte
Use the Svelte adapter for your project.
```
````

## Example

```tabs
# React
Use the React adapter. Import from `@ephem-sh/petit/react` and wrap your app.

# Vue
Use the Vue adapter. Add the plugin to your `app.use()` chain.

# Svelte
Use the Svelte adapter. Add the preprocessor to your `svelte.config.js`.
```

## API Reference

```type-table
# Tab Properties
label | string | required | Tab button label (from `# Label` line)
content | string | required | Tab panel content (supports inline markdown)
```
