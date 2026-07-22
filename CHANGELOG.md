# Changelog

All notable changes to this project are documented here.
This file is generated from Conventional Commit messages.

## [Unreleased]

_Nothing yet._

## [0.3.0] - 2026-07-21

### Features

- **cli:** add petit check to validate config without building (cddc199)
- **release:** generate root and package changelogs from commits (41c1bcf)

### Fixes

- **dev:** allow every node_modules ancestor so pnpm dev works (dc65069)
- **docs:** redirect orphaned section paths to first child page (928f8fd)
- **ci:** stop shell injection breaking release version detection (2a1ef95)

### Documentation

- **skills:** steer petit-writer agents to check and dev, not build (407de42)
- document petit check and gitignoring the .petit build output (da6e868)

## [0.2.0] - 2026-07-06

### Features

- **skills:** rename petit-writer skill for skills.sh install (32576d3)
- **cli:** add --verbose flag to petit dev (ed88ccb)
- **seo:** serve llms in both .txt and .md, carry real frontmatter (22856a5)

### Fixes

- **dev:** scope HMR watcher to doc dirs for reliable hot reload (09a624f)

### Performance

- **dev:** persist Vite dep cache, repeat npx dev ~18s to ~11s (45e48c9)

### Documentation

- correct llms/seo reference and document dev flags (573aaed)

### Chores

- add headless --yes flag to release script (f26ded3)

## [0.1.17] - 2026-03-19

### Features

- add github icon and move theme switcher, fix allowlist for vite on dev mode (d751b31)

## [0.1.16] - 2026-03-19

### Fixes

- clone user favicon on scaffold to correct public folder (8d08daa)

## [0.1.15] - 2026-03-19

### Features

- updated docs and skills for the new updated frontmatter config, modified core package to support updated on frontmatter (4752107)

## [0.1.14] - 2026-03-19

### Features

- add credits config, profiling flag, writer skill, and DX fixes (6977391)

### Fixes

- update relative path for urls (825fc2a)

### Chores

- remove shiki and rehype-shiki for shiki/core, engine, langs, themes packages (8c3c689)

## [0.1.13] - 2026-03-19

### Features

- add nested categories discovery, improve links ui and local dev setup (65525cb)

### Fixes

- use independent chokidar watcher for HMR when running via npx/bunx (4986235)

### Chores

- add light mode icon for openai, change shiki engine to js-compat (fcebc28)

## [0.1.12] - 2026-03-18

### Features

- add vite config hook to allow serving fonts from tmp dir (ed82029)

### Documentation

- update netlify deployment documentation (0c1ed0c)

### Chores

- update docs for railway support and move petit config back to vercel (b092056)
- bump engine version (250a185)
- change deploy petit config to node (472374e)

## [0.1.11] - 2026-03-18

### Features

- add netlify flag support (231f664)

### Fixes

- add functions to netlify command (7ca1e10)
- try diff path for netlify command (2e5ac52)
- change command logic for netlify (5d95b3b)
- change netlify build output (7a659da)

### Documentation

- update cloudflare deployment section (c2834f5)

### Chores

- test netlify mv instead cp (4ff497f)
- extended logs for netlify (8ec5dc4)
- try diff command pattern (e8f329a)
- debug netlify output (179cf18)
- add log to netlify command (3c29772)
- setup netlify to skip install (d96415b)
- add netlify config (f4739d0)

## [0.1.10] - 2026-03-18

### Chores

- clean up build logs (a9b165f)

## [0.1.9] - 2026-03-18

### Documentation

- update vercel deployment guide, split seo and llms references (2733dae)

## [0.1.8] - 2026-03-18

### Fixes

- update media path for published template (23b51b4)

## [0.1.7] - 2026-03-18

### Fixes

- update vercel vite config (8b901b3)

## [0.1.6] - 2026-03-18

### Features

- scaffold .petit/ build workspace instead of building inside npm cache (47b7560)

## [0.1.5] - 2026-03-18

### Features

- handle multiple packages on output dir (128d198)

## [0.1.4] - 2026-03-18

### Features

- bundle web app inside @ephem-sh/petit for standalone usage (2822f79)

## [0.1.3] - 2026-03-17

### Fixes

- correct package.json paths in petit package (b068240)
- move CI to package only, not on apps/docs (3e32173)
- move workflows to develop branch (fd21a0c)

## [0.1.2] - 2026-03-17

### Features

- fix convetions, og image generation, CI and release workflows (ff8a6d7)

## [0.1.1] - 2026-03-17

### Chores

- first commit, core pre 0.1.0 (8927c02)
