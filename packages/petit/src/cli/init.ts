import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { defineCommand } from "citty"

const CONFIG_TEMPLATE = `{
	"title": "My Docs",
	"sidebar": [
		{ "label": "Getting Started", "path": "./getting-started" }
	]
}
`

const OVERVIEW_TEMPLATE = `---
title: Overview
order: 1
---

# Overview

Welcome to your documentation!
`

/** Write a file only if it does not already exist */
async function writeIfMissing(filePath: string, content: string): Promise<boolean> {
	if (existsSync(filePath)) {
		console.warn(`[petit] Skipping (already exists): ${filePath}`)
		return false
	}
	await mkdir(dirname(filePath), { recursive: true })
	await writeFile(filePath, content, "utf-8")
	return true
}

/** The `petit init` command - scaffolds a new documentation project */
export const initCommand = defineCommand({
	meta: {
		name: "init",
		description: "Initialize a new documentation project in a docs/ folder",
	},
	async run() {
		const docsDir = resolve(process.cwd(), "docs")
		const created: string[] = []

		const configPath = join(docsDir, "petit.config.json")
		if (await writeIfMissing(configPath, CONFIG_TEMPLATE)) {
			created.push(configPath)
		}

		const overviewPath = join(docsDir, "getting-started", "overview.md")
		if (await writeIfMissing(overviewPath, OVERVIEW_TEMPLATE)) {
			created.push(overviewPath)
		}

		if (created.length === 0) {
			console.log("[petit] Nothing to create - all files already exist")
		} else {
			for (const file of created) {
				console.log(`[petit] Created: ${file}`)
			}
			console.log(`\n[petit] Run \`cd docs && npx @ephem-sh/petit dev\` to start`)
		}
	},
})
