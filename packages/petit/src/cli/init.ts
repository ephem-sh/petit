import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { createInterface } from "node:readline"
import { defineCommand } from "citty"

const CONFIG_TEMPLATE = `{
	"title": "My Docs",
	"sidebar": [
		{ "label": "Getting Started", "path": "./docs/getting-started" }
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

/** Prompt the user for a yes/no confirmation */
async function confirm(message: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout })
	return new Promise((resolve) => {
		rl.question(`${message} (y/N) `, (answer) => {
			rl.close()
			resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")
		})
	})
}

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
		description: "Initialize a new documentation project",
	},
	args: {
		yes: {
			type: "boolean",
			description: "Skip confirmation prompt",
			alias: "y",
			required: false,
		},
	},
	async run({ args }) {
		const cwd = resolve(process.cwd())
		const configPath = join(cwd, "petit.config.json")
		const overviewPath = join(cwd, "docs", "getting-started", "overview.md")
		const mediaDir = join(cwd, "docs", "media")

		console.log("[petit] This will create:")
		console.log(`  ${configPath}`)
		console.log(`  ${overviewPath}`)
		console.log(`  ${mediaDir}/`)
		console.log()

		if (!args.yes) {
			const ok = await confirm("[petit] Continue?")
			if (!ok) {
				console.log("[petit] Cancelled.")
				return
			}
		}

		const created: string[] = []

		if (await writeIfMissing(configPath, CONFIG_TEMPLATE)) {
			created.push(configPath)
		}

		if (await writeIfMissing(overviewPath, OVERVIEW_TEMPLATE)) {
			created.push(overviewPath)
		}

		if (!existsSync(mediaDir)) {
			await mkdir(mediaDir, { recursive: true })
			created.push(mediaDir)
		}

		if (created.length === 0) {
			console.log("[petit] Nothing to create, all files already exist.")
		} else {
			for (const file of created) {
				console.log(`[petit] Created: ${file}`)
			}
			console.log(`\n[petit] Run \`npx @ephem-sh/petit dev\` to start`)
		}
	},
})
