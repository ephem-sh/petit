---
title: Media
description: Images, logos, favicons, and media files
order: 7
updated: 2026-03-18
---

Petit serves media files from a directory relative to your
config. This page covers how images are resolved, served, and
optimized.

## How it works

When Petit starts, it looks for a media directory. It checks
`docs/media/` first, then `media/`, both relative to your
config file. The first one that exists wins. You can override
this with `mediaDir` in your config:

```json
{
  "mediaDir": "./assets/images"
}
```

In dev mode, Petit serves this directory at `/media/*` via
Vite middleware. At build time, files are copied to the output.

## Images in markdown

Use `./media/` paths in your markdown:

```markdown
![Dashboard screenshot](./media/screenshot.png)
```

Petit rewrites `./media/` and `media/` to `/media/` so files
resolve correctly. Images with alt text render inside a
`<figure>` with a `<figcaption>`.

## Theme-aware images

Name files with `.light.` or `.dark.` suffixes to show
different versions per color scheme:

```markdown
![Diagram](./media/diagram.light.png)
![Diagram](./media/diagram.dark.png)
```

Petit hides the light variant in dark mode and vice versa
using CSS classes. No JavaScript involved.

## Logo

The `logo` config option resolves from your media directory:

```json
{
  "logo": "logo.png"
}
```

This looks for `logo.png` inside the detected media folder.
The logo appears in the sidebar header. Without it, the site
title displays as text.

## Favicon

Petit checks your media directory for these files in order:

1. `favicon.ico`
2. `favicon.png`
3. `logo.png`

The first match is copied to the site's public directory and
added as a `<link rel="icon">` tag.

## Build-time optimization

When you run `npx @ephem-sh/petit build`, images are converted to WebP and
resized to 640px, 1024px, and 1920px widths. This requires
`sharp` as a dependency. Without it, images are served as-is.

Optimization runs on PNG, JPG, and JPEG files in the media
directory. Original files are not modified.
