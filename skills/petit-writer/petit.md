---
title: Petit framework reference
description: Complete reference for the Petit documentation framework - config, CLI, components, themes, markdown, media, SEO
---

# Petit reference

Local-first documentation framework. Vite-powered, markdown-based, static output.

## CLI

The CLI is invoked via a package runner with the `@ephem-sh/petit` package:

```
npx @ephem-sh/petit <command>
bun x @ephem-sh/petit <command>
pnpm dlx @ephem-sh/petit <command>
```

All commands accept `--config <path>` to specify config file location (e.g. `npx @ephem-sh/petit dev --config ./docs`).

| Command | Description |
|---------|-------------|
| `npx @ephem-sh/petit check [--docs]` | Validates petit.config.json and sidebar/doc discovery. Writes nothing. `--docs` also parses every markdown file to catch content errors. |
| `npx @ephem-sh/petit dev [--port <n>] [--verbose\|-v] [--profiling]` | Dev server at localhost:4321 (auto-increments if busy). Hot-reloads on .md/.mdx/config changes. Writes nothing into the project. |
| `npx @ephem-sh/petit build` | Produces deploy output. Scaffolds a build workspace, runs a full dependency install, and writes a `.petit/` directory into the project. **Do not use for testing or verification.** |
| `npx @ephem-sh/petit init [--yes]` | Scaffolds petit.config.json, docs/getting-started/overview.md, docs/media/. |
| `npx @ephem-sh/petit config [--path <dir>] [--yes]` | Creates minimal petit.config.json only. |
| `npx @ephem-sh/petit export [--output <file>]` | Single printable HTML of all pages (default: docs-export.html). |

### Verifying changes

Use `check` and `dev`, never `build`.

1. Run `npx @ephem-sh/petit check` after any config change. It reports invalid fields, missing sidebar paths, and empty categories without building.
2. Add `--docs` to parse every markdown file. Use this after content changes to catch frontmatter and component errors.
3. Run `npx @ephem-sh/petit dev` when you need to see the rendered result: sidebar order, links, images, components, search.

`build` is a deploy-artifact command. Running it to "test" installs dependencies and pollutes the user's repository with a `.petit/` directory. That directory holds an installed `node_modules` plus the build output, so it is large and must never be committed.

If the user genuinely needs a local build, tell them to add it to `.gitignore` first:

```gitignore
.petit/
```

If you ever run `build` by mistake, remove the generated `.petit/` directory (or confirm it is gitignored) instead of leaving it in the user's project.

## Config (petit.config.json)

Located at project root or inside docs/. Searched upward from cwd.

```json
{
  "title": "My Docs",
  "logo": "logo.png",
  "mediaDir": "./media",
  "defaultScheme": "dark",
  "schemeSwitcher": true,
  "theme": "default",
  "themeOverrides": {
    "dark": { "custom": { "primary": "oklch(0.7 0.2 200)" } }
  },
  "sidebar": [
    { "label": "Guide", "path": "./getting-started" },
    { "label": "Reference", "path": "./reference" }
  ],
  "sidebarPosition": "left",
  "fonts": { "sans": "Inter", "mono": "JetBrains Mono" },
  "maxWidth": "lg",
  "toc": true,
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "siteUrl": "https://docs.example.com",
  "deploy": "node"
}
```

### Field reference

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| title | string | **required** | Site title |
| logo | string | - | Filename in mediaDir. Dark variant auto-detected: `logo.dark.png` |
| mediaDir | string | auto | Relative to config. Checks `docs/media` then `media` |
| defaultScheme | `"dark"` \| `"light"` \| `"system"` | `"system"` | Initial color scheme |
| schemeSwitcher | boolean | `true` | Show light/dark toggle |
| theme | string | `"default"` | Theme preset name |
| themeOverrides | object | `{}` | CSS variable overrides per scheme (oklch values) |
| sidebar | SidebarItem[] | `[]` | Navigation structure |
| sidebarPosition | `"left"` \| `"right"` \| `"center"` | `"left"` | Fixed sidebar or inline (center) |
| fonts | object | - | `{ sans?: string, mono?: string }` Google Fonts |
| maxWidth | `"sm"` \| `"md"` \| `"lg"` \| `"xl"` | `"lg"` | Content area max width |
| toc | boolean | `true` | Show "On this page" sidebar |
| repository | string | - | GitHub URL for edit links |
| branch | string | `"main"` | Git branch for edit links |
| siteUrl | string (URL) | - | Enables SEO: sitemap, OG images, llms.txt, canonical URLs |
| deploy | `"node"` \| `"cloudflare"` \| `"netlify"` \| `"vercel"` \| `"bun"` | `"node"` | Deploy target platform |
| credits | boolean | `false` | Show "Created with petit" link in sidebar. New projects get `true` via init |

### Sidebar items

```json
{ "label": "Category Name", "path": "./relative/to/config" }
```

- `path` points to a directory of .md/.mdx files
- Files sorted by frontmatter `order` (ascending), then alphabetically
- Omit `path` for a category-only divider (no entries)

## Frontmatter

```yaml
---
title: Page title
description: Summary for meta tags and search
order: 1
draft: true
updated: 2026-03-15
---
```

All fields optional. `draft: true` hides from sidebar, search, and build output.
No `order` = sorted last. No `title` = derived from filename (kebab-to-title).
`updated` overrides the "last updated" date (falls back to file modification time).

## Markdown features

Standard GFM plus:

- **Tables, strikethrough, task lists** (GFM)
- **Math**: inline `$E = mc^2$`, block `$$...$$` (KaTeX)
- **Code blocks**: language after fence, filename in meta (` ```ts config.ts `), copy button, theme-aware highlighting (Shiki)
- **Images**: `./media/image.png` rewritten to `/media/image.png`. Alt text renders as figcaption.
- **Theme-aware images**: `image.light.png` / `image.dark.png` auto-toggled by CSS
- **Headings**: auto-generate IDs (rehype-slug), clickable anchor links. H2-H3 indexed in TOC.

## Components

All components use fenced code blocks with special language names. Sections separated by `# Title` lines inside the fence.

### Callouts

```markdown
> [!NOTE]
> Content here
```

Types: `NOTE`, `TIP`, `INFO`, `WARNING`, `DANGER`

### Tabs

````markdown
```tabs
# Tab one
Content for tab one.

# Tab two
Content for tab two.
```
````

### Accordion

````markdown
```accordion
# Section one
Collapsible content.

# Section two
More collapsible content.
```
````

Uses native `<details>/<summary>`.

### Cards

````markdown
```cards
# Card title
Description text.
/optional/link/path

# Another card
Description only, no link.
```
````

Grid layout. First line after heading = description. Line starting with `/` = link target.

### Steps

````markdown
```steps
# First step
Do this thing.

# Second step
Then do this.
```
````

Numbered vertical timeline with connectors.

### Install tabs

````markdown
```install
my-package
```
````

Auto-generates tabs for npm, pnpm, bun, yarn with correct install commands.

### Command tabs

````markdown
```command npm pnpm bun
my-command
```
````

Custom package managers specified in meta. Prefixes command with each manager name.

The `live` flag changes the prefix from package manager to runner (`npx`, `bunx`, `pnpm dlx`):

````markdown
```command live
my-command
```
````

Use `live` for commands the user runs directly (not install commands). Without `live`, the output prefixes with `npm`, `pnpm`, `bun`. With `live`, it prefixes with `npx`, `pnpm dlx`, `bunx`.

### Type table

````markdown
```type-table
# TypeName
field1 | string | "default" | Description of field
field2 | number | 0 | Another field description
```
````

Columns: Property, Type, Default, Description.

### Mermaid diagrams

````markdown
```mermaid
graph TD
  A --> B
```
````

Rendered client-side via mermaid.js.

### Video embeds

````markdown
```youtube
dQw4w9WgXcQ
```

```vimeo
123456789
```
````

YouTube uses nocookie embed. Responsive 16:9 container.

### Component nesting

Components can be nested inside other components. Common patterns:

- `command` or `install` blocks inside `steps` - works
- Code blocks inside `tabs` - works (use four backticks for the outer fence)
- `callouts` inside `steps` - works
- `tabs` inside `tabs` - not supported

When nesting fenced components, use increasing backtick counts for the outer fence (four backticks wrapping three backticks).

## Themes

18 built-in themes: `default`, `2077`, `amber`, `burgundy`, `claude`, `deep`, `ghibli`, `itadori`, `offworld`, `pine`, `starbucks`, `stella`, `supabase`, `supra`, `t3chat`, `vercel`, `void`, `zen`

Colors use oklch() format. Override with `themeOverrides`:

```json
{
  "theme": "claude",
  "themeOverrides": {
    "dark": {
      "custom": {
        "primary": "oklch(0.7 0.15 250)",
        "background": "oklch(0.15 0 0)"
      }
    }
  }
}
```

CSS variables generated: `--color-{name}`, `--font-{name}`.

Each theme defines: background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, radius, card, popover, sidebar-* variants. Plus fonts (sans, mono), shiki themes (light, dark), and prose settings (heading sizes, body size, line-height, code radius).

## Media

- Place files in mediaDir (default: `docs/media/`)
- Reference in markdown: `![alt](./media/file.png)`
- Dark variant convention: `file.dark.png` alongside `file.png` (auto-toggled)
- Logo dark variant: `logo.dark.png` alongside `logo.png` (auto-detected, no config needed)
- Favicon: auto-detected from mediaDir (checks favicon.ico, favicon.png, logo.png)
- Build optimizes images: WebP conversion, responsive sizes (640/1024/1920px) via sharp

## SEO and AI (requires siteUrl)

When `siteUrl` is configured, build generates:

| Asset | Path | Purpose |
|-------|------|---------|
| Sitemap | `/sitemap.xml` | Standard XML sitemap |
| Robots | `/robots.txt` | Points to sitemap |
| OG images | `/og/{slug}.png` | 1200x630 PNG per page (satori + resvg) |
| LLM index | `/llms.txt` | Machine-readable page index |
| LLM full | `/llms-full.md` | All docs concatenated |
| Raw pages | `/{slug}.md` | Individual raw markdown per page |

Meta tags auto-generated: og:title, og:description, og:image, twitter:card, canonical URL, article:modified_time, JSON-LD structured data.

OG image slugs strip the docs directory prefix: `docs/getting-started/overview` becomes `/og/getting-started-overview.png`.

## Generated files (src/.petit/)

The Vite plugin writes these files for the app to import:

| File | Content |
|------|---------|
| config.ts | Resolved config object |
| sidebar.ts | Sidebar structure with slugs |
| docs.ts | Map of slug to {html, raw, frontmatter, headings, lastModified, filePath} |
| theme.css | CSS variables + prose styles |
| search.ts | Serialized Orama search index |
| themes.ts | All theme definitions |
| error.ts | null or config error message |

## Dev server features

- Hot-reload on .md/.mdx/config changes (300ms debounce)
- Media served at `/media/*` from mediaDir
- On-demand OG images at `/og/{slug}.png`
- LLM endpoints available: `/llms.txt`, `/llms-full.md`, `/{slug}.md`
