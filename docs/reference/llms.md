---
title: LLMs
description: Machine-readable endpoints for AI agents and large language models
order: 3
---

Petit makes your documentation directly consumable by large
language models and AI agents through several machine-readable
endpoints. All LLM endpoints activate when you set `siteUrl`
in your configuration file.

## llms.txt

A machine-readable index of all documentation pages, served at
`/llms.txt`. It lists every non-draft page with a link to its
individual markdown file:

```
# My Project

> My Project documentation

This file lists all documentation pages for My Project.
For the full documentation in a single file,
see: https://docs.example.com/llms-full.md

## Docs

- [Overview](https://docs.example.com/getting-started/overview.md)
- [Configuration](https://docs.example.com/getting-started/configuration.md)
```

## llms-full.md

All documentation concatenated in sidebar order into a single
markdown file, served at `/llms-full.md`. This is useful for
feeding an entire documentation site into an LLM context window.

Petit also adds an alternate link tag in the HTML head of every
page, pointing browsers and crawlers to this file:

```html
<link rel="alternate" type="text/markdown"
	  href="/llms-full.md" />
```

## Individual markdown endpoints

Every documentation page is available as raw markdown at
`/{slug}.md`. For example, `https://docs.example.com/getting-started/overview.md`
serves the raw markdown for the overview page, prefixed with
the page title and description as a heading and blockquote.

All LLM endpoints work in both dev and production. In dev mode,
they are served from memory via Vite middleware. In production,
they are generated as static files.
