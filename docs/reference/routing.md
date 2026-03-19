---
title: Routing and navigation
description: How Petit generates URLs and builds the sidebar
order: 5
---

Petit generates your site's URL structure and sidebar navigation
from two things: the `sidebar` array in your config and the
markdown files in those directories.

## How URLs are generated

Petit scans each sidebar directory for `.md` and `.mdx` files.
The URL for each page is built from the sidebar path and filename:

```
sidebar path:  ./getting-started
filename:      overview.md
URL:           /getting-started/overview
```

Another example with a nested structure:

```
sidebar path:  ./api
filename:      authentication.md
URL:           /api/authentication
```

The root URL (`/`) automatically redirects to the first non-draft
page in your sidebar.

## Sidebar structure

The `sidebar` array in your config controls which directories
Petit scans for content. Each `path` is relative to the config
file:

```
my-project/
  petit.config.json
  docs/
    getting-started/          <-- path: "./docs/getting-started"
      overview.md
      installation.md
    api/                      <-- path: "./docs/api"
      authentication.md
```

```json
{
  "sidebar": [
    { "label": "Getting Started", "path": "./getting-started" },
    { "label": "API Reference", "path": "./api" },
    { "label": "Examples", "path": "./examples" }
  ]
}
```

Each item becomes a category in the sidebar. The `label` is the
category heading, and `path` points to a directory relative to
the config file. Petit reads every `.md` and `.mdx` file in that
directory and lists them under the category.

Items without a `path` appear as non-clickable section headers.
This is useful for grouping related categories:

```json
{
  "sidebar": [
    { "label": "Getting Started", "path": "./getting-started" },
    { "label": "Reference" },
    { "label": "Core API", "path": "./reference/core" },
    { "label": "Plugins", "path": "./reference/plugins" }
  ]
}
```

## Nested categories

Petit automatically discovers subdirectories inside each sidebar
path and renders them as nested categories. You don't need to list
every subdirectory in your config. Point a sidebar entry at a
parent directory and Petit walks into its subdirectories, up to
three levels deep.

Given this directory structure:

```
docs/
  examples/
    overview.md
    go/
      hello-world.md
      middleware.md
    python/
      fastapi.md
      hello-world.md
    rust/
      hello-world.md
```

And this config:

```json
{
  "sidebar": [
    { "label": "Examples", "path": "./docs/examples" }
  ]
}
```

Petit creates an "Examples" category with `overview.md` as a
direct entry, plus three subcategories ("Go," "Python," "Rust")
each containing their own entries.

Subcategory labels are derived from the directory name using the
same kebab-to-title conversion as filenames. A directory named
`getting-started` becomes "Getting Started."

### Sorting in nested categories

Top-level entries still respect the `order` frontmatter field.
Entries inside subdirectories are sorted alphabetically by label.
Subcategories themselves are also sorted alphabetically.

### Depth limit

Petit recurses up to three levels deep. Directories beyond the
third level are ignored. For most documentation sites, one or two
levels of nesting is sufficient.

```
examples/           <-- depth 0 (top-level category)
  go/               <-- depth 1 (subcategory)
    advanced/       <-- depth 2 (sub-subcategory)
      internals/    <-- depth 3 (maximum)
        deeper/     <-- ignored
```

## Sort order

Pages within each category are sorted in two steps:

1. By the `order` field in frontmatter (lower numbers first)
2. Alphabetically by label when order values are equal

```yaml
---
title: Quick start
order: 1
---
```

Pages without an `order` field appear after all ordered pages.

## Frontmatter

Every markdown file can include YAML frontmatter to control how
it appears in the sidebar, on the page, and in search results:

```yaml
---
title: API Reference
description: Complete API documentation
order: 2
draft: false
---
```

```type-table
# Frontmatter
title | string | - | Page title used in sidebar, browser tab, and SEO
description | string | - | Short summary for SEO meta tags and previews
order | number | - | Sort position within its section (lower first)
draft | boolean | false | Hide the page from sidebar, search, and navigation
```

## Page labels

The sidebar label for each page comes from the `title` field in
its frontmatter. If no title is set, Petit converts the filename
from kebab-case to title case. For example, `api-reference.md`
becomes "Api Reference."

Set explicit titles for full control:

```yaml
---
title: API Reference
---
```

## Draft pages

Mark a page as a draft to hide it from the sidebar and all
navigation, including pagination and search:

```yaml
---
title: Work in progress
draft: true
---
```

Draft pages are excluded from the build output entirely. They
don't appear in the sidebar, pagination, search index, sitemap,
or LLM endpoints.

## Pagination

Every page shows previous and next links at the bottom. The order
follows the sidebar: top to bottom, category by category.
Pagination skips draft pages.

## 404 handling

If someone visits a URL that doesn't match any document, Petit
shows a simple 404 page with the requested path. This applies to
both dev mode and the production build.
