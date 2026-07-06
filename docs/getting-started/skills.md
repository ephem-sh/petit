---
title: SKILL.md
description: Use the petit-writer skill with Claude Code to generate and maintain documentation
order: 5
updated: 2026-07-06
---

Petit ships with a agentic skill called `petit-writer` that
teaches agents how to write documentation using Petit's components,
configuration, and conventions. When installed, the agent knows how to
set up Petit from scratch, write pages with the correct frontmatter,
use components like tabs, steps, and cards, and configure
`petit.config.json` properly.

## What it does

The skill gives agents three reference files:

- **Writing standards** - voice, tone, formatting rules, and a
  verification checklist
- **Petit reference** - the full config schema, every CLI command,
  all components with syntax, themes, media handling, and SEO
- **Setup guide** - a playbook for creating documentation from zero,
  including information architecture and page classification

When you invoke the skill, the agent reads the relevant references and
applies them to your request. It can write new pages, edit existing
docs, configure your project, or set up Petit in a new repo.

## Install

The fastest way to install the skill is with the [skills.sh](https://skills.sh)
CLI. It is cross-agent: it works with Claude Code, Codex, Cursor,
Windsurf, and 68+ other agents. It auto-detects the agents you have
installed and installs the `petit-writer` skill into each agent's
skills directory for you.

```command live
skills add ephem-sh/petit
```

Add `-g` to install globally so the skill is available in every project.
To update to the latest version later, run:

```command live
skills update petit-writer
```

### Direct path

You can also point skills.sh straight at the skill directory in the
repository:

```command live
skills add https://github.com/ephem-sh/petit/tree/develop/skills/petit-writer
```

### Manual install

If you prefer not to use the CLI, copy the `skills/petit-writer/`
directory from the Petit repository into your agent's skills folder.
For Claude Code that is `.claude/skills/` for a single project or
`~/.claude/skills/` to make the skill global.

````steps
# Copy the skill to your project

Download or copy the `skills/petit-writer/` directory from the
Petit repo into `.claude/skills/` in your project.

# Verify the skill is available

Open Claude Code in your project. Type `/petit-writer` and you will see
the skill in the autocomplete list.
````

## Usage

Invoke the skill directly with a slash command:

```
/petit-writer
```

You can also pass arguments to describe what you want:

```
/petit-writer "add a deployment guide for Railway"
/petit-writer "update the API reference for the new auth module"
/petit-writer "set up Petit docs from scratch for this project"
```

Agents could also invokes the skill automatically when you ask it to
write or edit documentation in a project that has Petit configured, based on your hook setups.

## Examples

Here are common tasks the skill handles:

- **New docs from scratch** - "Set up documentation for this
  project using Petit. It's a CLI tool written in Rust."
- **Write a page** - "Write a getting started guide that covers
  installation and the first three commands."
- **Edit existing docs** - "The auth module changed. Update the
  reference page to match the new API."
- **Configure Petit** - "Add a dark theme, enable SEO, and set up
  the sidebar for three categories."
- **Use components** - "Add install tabs for the package and a
  steps component for the setup flow."

## Customization

The skill files are plain markdown. You can modify them to fit your
project's conventions:

- Edit `documentation.md` to adjust voice, tone, or formatting
  rules for your team
- Edit `petit.md` if you add custom components or use a specific
  subset of Petit features
- Edit `setup.md` to match your project's category structure or
  content priorities

Restart your agent and try your changes.
