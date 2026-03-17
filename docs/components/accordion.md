---
title: Accordion
description: Collapsible content sections
order: 6
---

# Accordion

Collapsible content sections using native HTML details/summary. No JavaScript required.

## Usage

Use the `accordion` code fence. Each `# Title` creates a collapsible section.

````markdown
```accordion
# What is Petit?
A local-first documentation platform that requires zero generated files.

# How do I install it?
Run `npx @ephem-sh/petit` in your project directory.

# Does it support dark mode?
Yes, with system, light, and dark themes.
```
````

## Example

```accordion
# What is Petit?
A local-first documentation platform that requires zero generated files in your repository. Just write markdown and run.

# How do I install it?
Run `npx @ephem-sh/petit` in your project directory. No dependencies to add to your project.

# Does it support dark mode?
Yes, with system, light, and dark themes plus full CSS variable customization via the theme system.
```

## API Reference

```type-table
# Section Properties
title | string | required | Section heading (from `# Title` line)
content | string | required | Collapsible content (supports inline markdown)
```
