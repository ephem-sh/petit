---
title: Steps
description: Numbered step-by-step guides
order: 8
updated: 2026-03-16
---

# Steps

Display a numbered step-by-step guide with a visual timeline.

## Usage

Use the `steps` code fence. Each `# Title` creates a numbered step.

````markdown
```steps
# Install the package
Run the install command for your package manager.

# Create a config file
Add a `petit.config.json` to your project root.

# Start the dev server
Run `npx @ephem-sh/petit dev` and open the browser.
```
````

## Example

```steps
# Install the package
Run the install command for your preferred package manager.

# Create a config file
Add a `petit.config.json` to your docs directory with your title and sidebar structure.

# Write your docs
Create markdown files in the directories referenced by your sidebar config.

# Start the dev server
Run `npx @ephem-sh/petit dev` and open your browser to see the docs.
```

## API Reference

```type-table
# Step Properties
title | string | required | Step heading (from `# Title` line)
content | string | required | Step description (supports inline markdown)
```
