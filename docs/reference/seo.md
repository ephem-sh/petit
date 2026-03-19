---
title: Programmatic SEO
description: Automatic search engine optimization for your documentation
order: 2
updated: 2026-03-19
---

Petit generates comprehensive SEO metadata and Open Graph images
automatically. All SEO features activate when you set `siteUrl`
in your configuration file.

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
a sitemap, and robots.txt for every page in your documentation.

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

## Last updated date

Every page displays a "last updated" date below the content. Petit
resolves this date using two sources in priority order:

1. **Frontmatter** -- set `updated` in your frontmatter to use an
   explicit date
2. **File modification time** -- if no frontmatter date is set, Petit
   uses the filesystem modification time (reflects the build time in
   CI environments)

```yaml
---
title: My page
updated: 2026-03-15
---
```

The date appears in the page footer and is included in the
`article:modified_time` Open Graph tag and `dateModified` JSON-LD
field for search engines.

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
