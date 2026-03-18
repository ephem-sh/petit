---
title: Deployment
description: Deploy your documentation to any hosting platform
order: 4
---

Petit builds your docs for any hosting platform. Set the `deploy`
field in your config to target a specific platform, then run the
build command.

```command live
@ephem-sh/petit build
```

Petit installs any platform-specific dependencies automatically
during the build. You don't need a `package.json` or
`node_modules` in your project.

## Deploy targets

Set the `deploy` field in `petit.config.json` to match your
hosting platform:

```json
{
  "title": "My Docs",
  "deploy": "cloudflare"
}
```

```type-table
# Deploy options
node | string | "node" | Default. Builds with Nitro for any Node.js server or Docker container
cloudflare | string | - | Cloudflare Workers via @cloudflare/vite-plugin
netlify | string | - | Netlify via @netlify/vite-plugin-tanstack-start
vercel | string | - | Vercel with auto-detection via Nitro
bun | string | - | Bun runtime via Nitro with the bun preset
```

## Cloudflare Workers

Cloudflare Workers provides edge deployment with global
distribution. Set the deploy target and build:

```json petit.config.json
{
  "title": "My Docs",
  "deploy": "cloudflare",
  "siteUrl": "https://docs.example.com"
}
```

```command live
@ephem-sh/petit build
```

Petit generates a `wrangler.jsonc` and installs
`@cloudflare/vite-plugin` and `wrangler` automatically during
the build.

To deploy from your local machine, authenticate with Cloudflare
and run the deploy command:

```bash
npx wrangler login
npx wrangler deploy
```

For CI/CD, connect your repository in the Cloudflare dashboard.
Set the build command to `npx @ephem-sh/petit build`.

## Netlify

Netlify provides continuous deployment with automatic builds on
every push. Set the deploy target:

```json petit.config.json
{
  "title": "My Docs",
  "deploy": "netlify",
  "siteUrl": "https://docs.example.com"
}
```

```command live
@ephem-sh/petit build
```

Petit installs `@netlify/vite-plugin-tanstack-start` automatically
during the build.

Connect your repository in the Netlify dashboard. Set the build
command to `npx @ephem-sh/petit build`. Netlify detects the
output directory automatically.

## Vercel

Vercel auto-detects the build output through Nitro. Set the
deploy target:

```json petit.config.json
{
  "title": "My Docs",
  "deploy": "vercel",
  "siteUrl": "https://docs.example.com"
}
```

Import your repository in the Vercel dashboard. Set the build
command to `npx @ephem-sh/petit build`. Vercel handles the rest.

## Node.js and Docker

The default `node` target works for any Node.js server or Docker
container. Build and start the server:

```command live
@ephem-sh/petit build
```

```bash
node .output/server/index.mjs
```

The server starts on port 3000 by default. Static assets are
served from `.output/public`.

For Docker, use a multi-stage build:

```dockerfile Dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN npx @ephem-sh/petit build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/.output .output
CMD ["node", ".output/server/index.mjs"]
```

## Bun

Bun requires React 19. Set the deploy target:

```json petit.config.json
{
  "title": "My Docs",
  "deploy": "bun",
  "siteUrl": "https://docs.example.com"
}
```

```command live
@ephem-sh/petit build
```

```bash
bun .output/server/index.mjs
```

## Static export

For static hosting without a server, the build output at
`.output/public` contains all static assets. You can serve
this directory with any static file server:

```bash
npx serve .output/public
```

## SEO in production

To get full SEO support (sitemap, OG images, robots.txt, and
LLM endpoints), set `siteUrl` in your config before building:

```json
{
  "siteUrl": "https://docs.example.com"
}
```

See the [SEO reference](/docs/reference/seo) for details on
what gets generated.

## Image optimization

Petit converts PNG and JPG images to WebP at build time and
generates responsive sizes (640px, 1024px, 1920px). This runs
automatically during build if sharp is installed.

## Offline support

The built site includes a service worker that caches pages
after the first visit. Returning visitors can browse cached
pages without a network connection. The service worker updates
the cache in the background when a connection is available.
