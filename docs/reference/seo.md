---
title: SEO and AI discoverability
description: Search engine optimization and LLM-friendly documentation
order: 2
---

Petit generates comprehensive SEO metadata, Open Graph images, and
AI-friendly endpoints automatically. All of these features activate
when you set `siteUrl` in your configuration file.

## Setup

Add a `siteUrl` property to your `petit.config.json` pointing to
your site's production URL:

```json
{
  "title": "My Project",
  "siteUrl": "https://docs.example.com",
  "sidebar": [...]
}
```

Once `siteUrl` is set, Petit generates canonical URLs, OG images,
a sitemap, robots.txt, and LLM-friendly endpoints for every page
in your documentation.

## Meta tags

Every page gets meta tags derived from its frontmatter `title`
and `description`. The `max-snippet:-1` directive tells search
engines and AI crawlers to use unlimited snippet text.

```accordion
# Page title and description
Petit generates a `title` tag formatted as "Page Title | Site
Name", a `description` meta tag, a `robots` directive with
`max-snippet:-1` for unlimited AI snippets, and a `canonical`
link pointing to the page's absolute URL.

# Open Graph tags
Each page gets `og:type`, `og:title`, `og:description`,
`og:site_name`, `og:url`, and `og:image` tags. Petit also
generates matching Twitter Card tags (`twitter:card`,
`twitter:title`, `twitter:description`, `twitter:image`) so
previews work on all social platforms.

# JSON-LD structured data
When a page has a `description` in its frontmatter, Petit injects
a JSON-LD script block with `TechArticle` schema containing the
headline, description, URL, and OG image. Pages without a
description don't get JSON-LD output.
```

## Open Graph images

Petit auto-generates OG images at build time using satori and
resvg. Each image is a 1200x630 PNG with a dark theme background
that displays the site name, page title, and description. Images
use the Inter font in Regular and Bold weights.

Images are written to `public/og/{slug}.png`. Slashes in the slug
become dashes, for example `getting-started/overview` produces
`public/og/getting-started-overview.png`.

OG image generation is skipped in dev mode because it's too slow
for the development feedback loop. The meta tags still render with
the correct image URLs so you can verify your markup.

## Sitemap and robots.txt

Petit generates both files as static assets in `public/` at build
time.

### Sitemap

The sitemap at `public/sitemap.xml` includes the root URL and
every non-draft documentation page in standard XML sitemap format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://docs.example.com</loc>
  </url>
  <url>
    <loc>https://docs.example.com/getting-started</loc>
  </url>
</urlset>
```

### robots.txt

The generated `public/robots.txt` allows all crawlers and points
them to the sitemap:

```
User-agent: *
Allow: /

Sitemap: https://docs.example.com/sitemap.xml
```

## LLM and AI agent support

Petit makes your documentation directly consumable by large
language models and AI agents through several machine-readable
endpoints.

### llms.txt

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

### llms-full.md

All documentation concatenated in sidebar order into a single
markdown file, served at `/llms-full.md`. This is useful for
feeding an entire documentation site into an LLM context window.

Petit also adds an alternate link tag in the HTML head of every
page, pointing browsers and crawlers to this file:

```html
<link rel="alternate" type="text/markdown"
      href="/llms-full.md" />
```

### Individual markdown endpoints

Every documentation page is available as raw markdown at
`/{slug}.md`. For example, `https://docs.example.com/getting-started/overview.md`
serves the raw markdown for the overview page, prefixed with
the page title and description as a heading and blockquote.

All LLM endpoints work in both dev and production. In dev mode,
they're served from memory via Vite middleware. In production,
they're generated as static files.
