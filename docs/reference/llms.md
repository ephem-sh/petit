---
title: LLMs
description: Machine-readable endpoints for AI agents and large language models
order: 3
updated: 2026-07-06
---

Petit makes your documentation directly consumable by large
language models and AI agents through several machine-readable
endpoints. In dev mode the endpoints always work, served on demand
by Vite middleware without any configuration. In production (build),
they are generated as static files only when you set `siteUrl`,
because the absolute cross-links inside them require a known base URL.

Every endpoint is emitted with two extensions. The `.txt` form
follows the [llms.txt spec](https://llmstxt.org) convention, and the
`.md` form is provided for agents and tools that expect a markdown
extension. Cross-links match the extension of the file they live in:
`.txt` files link to other `.txt` files, and `.md` files link to
other `.md` files.

## llms.txt and llms.md

A machine-readable index of all documentation pages, served at
`/llms.txt` and `/llms.md`. It lists every non-draft page with a
link to its individual raw markdown file:

```
# My Project

> My Project documentation

This file lists all documentation pages for My Project.
For the full documentation in a single file,
see: https://docs.example.com/llms-full.txt

## Docs

- [Overview](https://docs.example.com/getting-started/overview.txt)
- [Configuration](https://docs.example.com/getting-started/configuration.txt)
```

The `.md` variant is identical except its links point to
`llms-full.md` and the `.md` per-page files.

## llms-full.txt and llms-full.md

All documentation concatenated in sidebar order into a single file,
served at `/llms-full.txt` and `/llms-full.md`. This is useful for
feeding an entire documentation site into an LLM context window.

Petit also adds an alternate link tag in the HTML head of every
page, pointing browsers and crawlers to the full markdown file:

```html
<link rel="alternate" type="text/markdown"
	  href="/llms-full.md" />
```

## Individual page endpoints

Every documentation page is available as raw markdown at both
`/{slug}.md` and `/{slug}.txt`. For example,
`https://docs.example.com/getting-started/overview.txt` serves the
raw markdown for the overview page, prefixed with the page title and
description as a heading and blockquote. This prefix is carried
through to the built files from each page's frontmatter, so
production output matches dev.
