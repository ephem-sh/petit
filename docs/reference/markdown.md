---
title: Markdown
description: Supported markdown features and syntax
order: 1
updated: 2026-11-26
---

Petit supports standard markdown with GitHub Flavored Markdown
extensions. All markdown files are processed through a
remark/rehype pipeline with Shiki syntax highlighting.

## Markdown and MDX

Petit picks the syntax from the file extension:

- `.md` files are CommonMark with GitHub Flavored Markdown. Raw
  HTML passes through, and a line indented by four spaces is a
  code block, so text like `<session>` inside it stays literal.
- `.mdx` files add JSX. Every tag must close, and indented code
  blocks are off, so use fenced code blocks instead.

A file that fails to parse stops `petit build` and `petit check`
with its path, line and column, and the lines around the error:

```bash
x docs/guide.mdx:10:1 Expected a closing tag for `<Foo>`
   > 10 | <Foo>unclosed
        | ^
```

In `petit dev` the broken page is reported and every other page
keeps serving.

> **Note:** Tailwind utility classes are generated only for the
> classes Petit's own components use. A class you write in raw
> HTML inside a markdown file, such as `<div class="mt-8">`, gets
> no generated style. Use the built-in components or inline
> `style` attributes instead.

## GitHub Flavored Markdown

Tables, strikethrough, task lists, and autolinks are supported
via remark-gfm.

| Feature | Syntax | Result |
|---------|--------|--------|
| **Bold** | `**bold**` | **bold** |
| *Italic* | `*italic*` | *italic* |
| ~~Strikethrough~~ | `~~text~~` | ~~text~~ |
| `Code` | `` `code` `` | `code` |
| [Link](#) | `[text](url)` | clickable link |

## Headings

Headings automatically get `id` attributes and anchor links. They
also appear in the table of contents sidebar when `toc` is enabled
in your config.

```markdown
## Second level
### Third level
#### Fourth level
```

Click any heading to copy its link to the clipboard. A brief
"Link copied!" message confirms the action.

## Code blocks

All code blocks get syntax highlighting via Shiki and a copy
button on hover. Specify the language after the opening fence:

```ts
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

Add a filename after the language to show a header bar:

```ts petit.config.ts
import { defineConfig } from "@ephem-sh/petit"

export default defineConfig({
  title: "My Docs",
})
```

## Math

Inline math uses single dollar signs: `$E = mc^2$` renders as
$E = mc^2$. Block math uses double dollar signs:

```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

Powered by KaTeX. Supports all standard LaTeX math syntax.

## Lists

Both ordered and unordered lists work as expected:

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

1. First step
2. Second step
3. Third step

Task lists are also supported:

- [x] Completed task
- [ ] Pending task

## Blockquotes

Use blockquotes for callouts or notes:

> **Note:** This is an important piece of information that
> readers should pay attention to.

## Tables

Standard markdown tables with alignment:

| Left | Center | Right |
|:-----|:------:|------:|
| Text | Text | Text |
| More | More | More |

## Images

Reference images with `./media/` paths in your markdown:

```markdown
![Alt text](./media/screenshot.png)
```

Petit rewrites these paths and serves files from your media
directory. See the [media reference](/reference/media) for
setup, theme-aware images, favicons, and optimization.

## Components

Petit extends markdown with custom components through special
code fences. These render as interactive HTML elements:

```cards
# Code blocks
Syntax highlighting with copy button and filename header
/components/codeblock

# Commands
Package manager install tabs
/components/command

# Diagrams
Mermaid.js diagrams rendered client-side
/components/diagram

# Cards
Clickable card grids for navigation
/components/cards

# Steps
Numbered step-by-step guides
/components/steps

# Tabs
Tabbed content panels
/components/tabs

# Accordions
Collapsible content sections
/components/accordion

# Type tables
Structured API reference tables
/components/type-table

# Callouts
Styled alert blocks for notes, warnings, and tips
/components/callout

# Videos
Embedded YouTube and Vimeo players
/components/video
```
