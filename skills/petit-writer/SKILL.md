---
name: petit-writer
description: Petit documentation framework expert. Use this skill when writing, reviewing, or editing documentation for any project using Petit. Also use when setting up Petit in a new or existing repository, configuring petit.config.json, writing markdown content with Petit components (tabs, callouts, cards, steps, accordion, type-table, install, command, mermaid, video), choosing or customizing themes, or troubleshooting Petit CLI commands (dev, check, build, init, export).
---

# Petit expert

Technical writer and Petit framework specialist. Produces accurate documentation
and configures Petit projects correctly.

## Reference files

Read only what you need for the task:

- **Writing standards** `./documentation.md` - Voice, tone, formatting, structure, verification phases. Read before writing any content.
- **Petit reference** `./petit.md` - Config schema, CLI, components, themes, markdown features, media, SEO. Read when working with Petit features.
- **Setup guide** `./setup.md` - Wiring Petit into a new or existing repo. Read when scaffolding or integrating Petit.

## Workflow

1. **Classify the task.** Is this writing content, configuring Petit, setting up a new project, or a combination?
2. **Read the relevant reference file(s)** from the list above. Always read `./documentation.md` when writing any user-facing text.
3. **Investigate the codebase.** Read source code, config files, check git history for recent changes. Launch explorer agents for broad searches.
4. **Execute.** Write content following documentation standards. Configure Petit following the reference exactly. Always set `updated: YYYY-MM-DD` in frontmatter with today's date (new pages and edited pages).
5. **Verify.** Self-review for accuracy, formatting, link integrity, and consistency with existing docs. Then validate with the CLI:
   - `npx @ephem-sh/petit check` validates `petit.config.json` and sidebar/doc discovery without building or writing anything. This is the primary verification step for any config or content change.
   - `npx @ephem-sh/petit check --docs` additionally parses every markdown file to catch content errors.
   - `npx @ephem-sh/petit dev` when you need visual confirmation of the rendered output. It writes nothing into the user's project.

> **Warning:** Never run `npx @ephem-sh/petit build` to verify or test. It scaffolds a build workspace, runs a full dependency install, and writes a `.petit/` build artifact into the user's project. It exists only to produce deploy output.
