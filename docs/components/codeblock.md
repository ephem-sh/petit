---
title: Codeblock
description: Syntax-highlighted code with copy button and optional filename
order: 2
updated: 2026-03-17
---

# Codeblock

All code blocks automatically get syntax highlighting via Shiki and a copy button on hover. Add a filename after the language to show a header bar.

## Usage

Basic code block:

````markdown
```ts
console.log("hello")
```
````

With filename header:

````markdown
```ts config.ts
export default { title: "My Docs" }
```
````

## Examples

### Basic

```ts
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

### With filename

```ts config.ts
import { defineConfig } from "@ephem-sh/petit"

export default defineConfig({
  title: "My Docs",
  sidebar: [
    { label: "Getting Started", path: "./getting-started" },
  ],
})
```

```python app.py
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

```json package.json
{
  "name": "my-project",
  "version": "1.0.0"
}
```

## Supported Languages

All languages supported by Shiki are available, including TypeScript, JavaScript, Python, Rust, Go, CSS, HTML, JSON, YAML, Bash, and many more.

## API Reference

```type-table
# Code Block Options
language | string | - | Language for syntax highlighting (e.g. `ts`, `python`, `bash`)
filename | string | - | Filename shown in header bar (placed after language, e.g. `ts config.ts`)
```
