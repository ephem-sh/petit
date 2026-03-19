---
title: Overview
description: Fast and local-first documentation platform
order: 1
updated: 2026-03-17
---

Petit is a small, fast, local-first documentation platform. Write
markdown, create a config, and run a single command.

## Features

```cards
# Local-first
Docs live in your repo as plain markdown
/getting-started/installation

# Full-text search
Client-side search powered by Orama
/reference/architecture

# Rich components
Cards, tabs, steps, accordions, diagrams
/reference/markdown

# SEO out of the box
Meta tags, OG images, sitemap, JSON-LD
/reference/seo

# AI-ready
llms.txt, llms-full.md, per-page .md endpoints
/reference/seo

# Deploy anywhere
Static output for Vercel, Cloudflare, Netlify
/getting-started/deployment
```

## Quick start

```steps
# Scaffold
Run `npx @ephem-sh/petit init` in your project root. This
creates a config file and a starter docs folder.

# Start
Run `npx @ephem-sh/petit dev` to preview your docs at
`http://localhost:4321`. Changes are picked up automatically.

# Write
Add markdown files to the directories in your sidebar config.
Each `.md` file becomes a page.
```
