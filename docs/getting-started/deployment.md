---
title: Deployment
description: Deploy your documentation to any hosting platform
order: 4
---

Petit builds to static files that work on any hosting platform.
Run the build command and deploy the output directory.

```bash
npx @ephem-sh/petit build
```

## Vercel

Import your repository in the Vercel dashboard. Set the build
command to `npx @ephem-sh/petit build` and the output directory
to `apps/docs/.output/public`. Deploys automatically on push.

## Cloudflare Pages

Create a project in the Cloudflare Pages dashboard and link your
repository. Set the build command to `npx @ephem-sh/petit build`
and the output directory to `apps/docs/.output/public`. Deploys
on every push.

## Netlify

Add your repository in the Netlify dashboard. Set the build
command to `npx @ephem-sh/petit build` and the publish directory
to `apps/docs/.output/public`. Deploys on every push.

## Static server

After building, serve the output with any static file server:

```bash
npx serve apps/docs/.output/public
```

## SEO in production

To get full SEO support (sitemap, OG images, robots.txt, and LLM
endpoints), set `siteUrl` in your config before building:

```json
{
  "siteUrl": "https://docs.example.com"
}
```

See the [SEO reference](/reference/seo) for details on what gets
generated.

## Image optimization

Petit converts PNG and JPG images to WebP at build time and
generates responsive sizes (640px, 1024px, 1920px). This runs
automatically during `petit build` if sharp is installed.

## Offline support

The built site includes a service worker that caches pages
after the first visit. Returning visitors can browse cached
pages without a network connection. The service worker updates
the cache in the background when a connection is available.
