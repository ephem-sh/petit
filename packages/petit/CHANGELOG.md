# Changelog

All notable changes to this project are documented here.
This file is generated from Conventional Commit messages.

## [Unreleased]

_Nothing yet._

## [0.3.1] - 2026-07-22

### Features

- **cli:** report unset options as hints in check, link config docs (c3fd238)

### Fixes

- **cli:** stop the sidebar scanner printing raw log output (75c4d0d)

## [0.3.0] - 2026-07-21

### Features

- **cli:** add petit check to validate config without building (cddc199)
- **release:** generate root and package changelogs from commits (41c1bcf)

### Fixes

- **dev:** allow every node_modules ancestor so pnpm dev works (dc65069)

## 0.2.0 (2026-07-06)

- chore: add headless --yes flag to release script
- feat(skills): rename petit-writer skill for skills.sh install
- docs: correct llms/seo reference and document dev flags
- feat(cli): add --verbose flag to petit dev
- perf(dev): persist Vite dep cache, repeat npx dev ~18s to ~11s
- fix(dev): scope HMR watcher to doc dirs for reliable hot reload
- feat(seo): serve llms in both .txt and .md, carry real frontmatter


## 0.1.17 (2026-03-19)

- feat: add github icon and move theme switcher, fix allowlist for vite on dev mode


## 0.1.16 (2026-03-19)

- fix: clone user favicon on scaffold to correct public folder


## 0.1.15 (2026-03-19)

- feat: updated docs and skills for the new updated frontmatter config, modified core package to support updated on frontmatter


## 0.1.14 (2026-03-19)

- feat: add credits config, profiling flag, writer skill, and DX fixes
- fix: update relative path for urls
- chore: remove shiki and rehype-shiki for shiki/core, engine, langs, themes packages


## 0.1.13 (2026-03-19)

- chore: add light mode icon for openai, change shiki engine to js-compat
- feat: add nested categories discovery, improve links ui and local dev setup
- fix: use independent chokidar watcher for HMR when running via npx/bunx


## 0.1.12 (2026-03-18)

- feat: add vite config hook to allow serving fonts from tmp dir
- chore: update docs for railway support and move petit config back to vercel
- chore: bump engine version
- chore: change deploy petit config to node
- docs: update netlify deployment documentation


## 0.1.11 (2026-03-18)

- feat: add netlify flag support
- chore: test netlify mv instead cp
- chore: extended logs for netlify
- chore: try diff command pattern
- chore: debug netlify output
- chore: add log to netlify command
- fix: add functions to netlify command
- fix: try diff path for netlify command
- fix: change command logic for netlify
- fix: change netlify build output
- chore: setup netlify to skip install
- chore: add netlify config
- docs: update cloudflare deployment section


## 0.1.10 (2026-03-18)

- chore: clean up build logs


## 0.1.9 (2026-03-18)

- docs: update vercel deployment guide, split seo and llms references


## 0.1.8 (2026-03-18)

- fix: update media path for published template


## 0.1.7 (2026-03-18)

- fix: update vercel vite config


## 0.1.6 (2026-03-18)

- feat: scaffold .petit/ build workspace instead of building inside npm cache


## 0.1.5 (2026-03-18)

- feat: handle multiple packages on output dir


## 0.1.4 (2026-03-18)

- feat: bundle web app inside @ephem-sh/petit for standalone usage


## 0.1.3 (2026-03-17)

- fix: correct package.json paths in petit package
- fix: move CI to package only, not on apps/docs
- fix: move workflows to develop branch


## 0.1.2 (2026-03-17)

- feat: fix convetions, og image generation, CI and release workflows


## 0.1.1 (2026-03-17)

- chore: first commit, core pre 0.1.0
