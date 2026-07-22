---
title: Documentation from scratch playbook
description: Full playbook for creating documentation from zero - research, architecture, content writing, and Petit configuration
---

# Documentation from scratch

End-to-end playbook for creating complete documentation for any project.
Follow every phase in order. Do not skip research.

## Phase 1: Understand the project

Before writing a single word, understand what you are documenting.

### Classify the project type

| Type | Documentation focus |
|------|-------------------|
| Library/package | API reference, installation, usage patterns, examples |
| CLI tool | Commands, flags, config files, workflows |
| SaaS/web app | Getting started, features, integrations, admin |
| API/service | Authentication, endpoints, SDKs, error handling |
| Framework | Concepts, guides, components, migration |
| Internal tool | Setup, workflows, troubleshooting, FAQ |

The type shapes everything: categories, tone, depth, what components to use.

### Deep research

Launch multiple explorer agents in parallel to investigate:

1. **Package exports** - What does the public API look like? Read every exported function, class, type.
2. **Config/schema files** - What is configurable? What are the defaults?
3. **README and existing docs** - What already exists? What is outdated?
4. **CLI entry points** - What commands exist? What flags do they accept?
5. **Test files** - Tests reveal intended behavior and edge cases.
6. **Git history** - Recent changes show what is actively evolving.
7. **Dependencies** - What ecosystem does this live in?
8. **Examples directory** - Real usage patterns the maintainers intended.
9. **Published package metadata** - Read `package.json`, `Cargo.toml`,
   `pyproject.toml`, or `go.mod` for the actual published names,
   versions, and binary entry points. These are the source of truth.

Collect raw notes. Do not write prose yet.

### Identify the audience

Ask yourself (or the user):
- Who reads this? Developers? End users? Ops?
- What do they already know? What is new to them?
- What is the first thing they need to do?
- What are common mistakes or confusion points?

## Phase 2: Information architecture

Design the structure before writing content.

### Choose categories

Categories map to sidebar entries in Petit. Common patterns by project type:

**Library/package:**
- Getting Started (overview, installation, quick start)
- Guides (common tasks, patterns, recipes)
- API Reference (functions, types, config)
- Examples (real-world use cases)

**CLI tool:**
- Getting Started (installation, first command)
- Commands (one page per command or group)
- Configuration (config file reference)
- Recipes (common workflows)

**SaaS/web app:**
- Getting Started (signup, first steps)
- Features (one page per feature area)
- Integrations (third-party connections)
- Administration (settings, billing, team)

**API/service:**
- Getting Started (auth, first request)
- Guides (common patterns)
- API Reference (endpoints grouped by resource)
- SDKs (language-specific guides)

**Framework:**
- Getting Started (install, hello world, concepts)
- Guides (routing, data, auth, deployment)
- Components/API (reference for each primitive)
- Migration (from other tools)

Adapt these patterns. Not every project fits a template.

### Design page order

Within each category, pages follow a learning path:

1. What is this? (overview/concepts)
2. How do I set it up? (installation/setup)
3. How do I use the basics? (quick start/tutorial)
4. How do I do specific things? (guides/recipes)
5. What are all the options? (reference/API)
6. What if something goes wrong? (troubleshooting)

Assign `order` values in frontmatter to enforce this sequence.

### Plan component usage

Decide upfront which Petit components each page needs:

| Content pattern | Component |
|----------------|-----------|
| Multiple install methods | `install` tabs |
| CLI commands across managers | `command` tabs |
| Step-by-step tutorial | `steps` |
| Feature overview grid | `cards` |
| Important warnings | callouts (`> [!WARNING]`) |
| API type definitions | `type-table` |
| Tabbed code examples | `tabs` |
| Collapsible details | `accordion` |
| Architecture diagrams | `mermaid` |

### Classify pages

Use this test to decide where a page belongs:

- If the page teaches the reader to accomplish a task, it's a
  **guide** (Getting Started, Guides category).
- If the page documents how something works or lists all options,
  it's a **reference** (Reference, API category).
- If you're unsure, ask: would a user read this before or after
  their first successful setup? Before = guide. After = reference.

## Phase 3: Write content

Now write. Follow `./documentation.md` for voice, tone, and formatting standards.

### Page structure

Every page follows this skeleton:

```markdown
---
title: Clear, descriptive title
description: One sentence summary for search and meta tags
order: 1
---

Introductory paragraph explaining what this page covers
and why the reader should care. No heading before this.

## First concept or step

Content...

## Second concept or step

Content...
```

### Writing rules

- Lead with what the reader needs to do, not background theory
- One concept per section. If a section grows past ~40 lines, split it.
- Code examples must be complete and runnable. No pseudo-code in guides.
  If showing command output, run the command and capture real output.
- Use components to break up walls of text (cards for navigation, steps for tutorials, callouts for gotchas)
- Cross-reference other pages with relative links
- Every page must have `title` and `description` frontmatter

### Content priorities

Write in this order (most critical first):

1. **Overview page** - First thing anyone reads. What is this? Why use it? Link to next steps (use cards).
2. **Installation/setup** - Get the reader from zero to running. Use install/command tabs and steps.
3. **Core guides** - The 2-3 most common workflows. These get the most traffic.
4. **Reference pages** - Complete but not first. People read guides first, reference later.
5. **Edge cases** - Troubleshooting, FAQ, migration. Write last.

## Phase 4: Configure Petit

After content exists, wire up the config.

### Create petit.config.json

Place it alongside the docs directory (at project root or inside docs/).

```json
{
  "title": "Project Name",
  "sidebar": [
    { "label": "Getting Started", "path": "./docs/getting-started" },
    { "label": "Guides", "path": "./docs/guides" },
    { "label": "Reference", "path": "./docs/reference" }
  ]
}
```

Sidebar `label` values should match the category names from Phase 2.
Each `path` points to a directory containing the .md files for that category.

### Add optional features

Layer these in based on the project needs:

```json
{
  "theme": "default",
  "logo": "logo.png",
  "siteUrl": "https://docs.example.com",
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "toc": true,
  "schemeSwitcher": true,
  "defaultScheme": "system",
  "maxWidth": "lg",
  "sidebarPosition": "left"
}
```

- Set `siteUrl` to enable SEO (sitemap, OG images, llms.txt)
- Set `repository` to enable "Edit on GitHub" links
- Choose a `theme` that fits the project brand (see `./petit.md` for 18 options)
- Place `logo.png` (and optional `logo.dark.png`) in the media directory

### File structure result

as example it would look like this: 

```
project-root/
  petit.config.json
  docs/
    getting-started/
      overview.md         (order: 1)
      installation.md     (order: 2)
      quick-start.md      (order: 3)
    guides/
      authentication.md   (order: 1)
      deployment.md       (order: 2)
    reference/
      api.md              (order: 1)
      configuration.md    (order: 2)
      cli.md              (order: 3)
    media/
      logo.png
      logo.dark.png
      screenshot.png
```

## Phase 5: Verify

1. Run `npx @ephem-sh/petit check --docs`. This validates the config,
   the sidebar paths, and every markdown file without building or
   writing anything. Fix every reported error before continuing.
2. Run `npx @ephem-sh/petit dev` and navigate every page
3. Run actual project commands and verify the output matches what
   the docs describe. Capture real terminal output for examples.
4. Check sidebar order matches the intended learning path
5. Verify all internal links work
6. Verify all images render (both light and dark mode)
7. Check code examples are syntax-highlighted correctly
8. Test search - do key terms find the right pages?
9. If `siteUrl` is set, verify OG images at `/og/{slug}.png` in the dev
   server (it serves them on demand)

> **Warning:** Do not run `npx @ephem-sh/petit build` to confirm the setup
> works. It runs a full dependency install and writes a `.petit/` build
> artifact into the user's project. It is only for producing deploy output.
> Use `check` and `dev` instead.
