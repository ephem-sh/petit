import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { defineCommand } from "citty"
import { watch } from "chokidar"
import { loadConfig } from "../config/loader"
import { scanSidebar } from "../sidebar/scanner"
import { parseDocument } from "../markdown/parse"
import { getPort } from "get-port-please"
import { writeData } from "../server/data-writer"
import type { PetitData, PetitDataDocument } from "../server/data-writer"

/**
 * Walk up from a starting directory to find the monorepo root (containing `turbo.json`),
 * then resolve `apps/docs` from there.
 */
function resolveAppRoot(): string {
	let dir = path.dirname(fileURLToPath(import.meta.url))
	while (dir !== path.dirname(dir)) {
		if (existsSync(path.join(dir, "turbo.json"))) {
			return path.join(dir, "apps", "docs")
		}
		dir = path.dirname(dir)
	}
	throw new Error("Could not find monorepo root. Ensure turbo.json exists at the project root.")
}

/** The `petit dev` command — starts a development server */
export const devCommand = defineCommand({
	meta: {
		name: "dev",
		description: "Start the development server",
	},
	args: {
		config: {
			type: "string",
			description: "Path to config file",
			required: false,
		},
	},
	async run({ args }) {
		const config = await loadConfig(args.config || undefined)
		const sidebar = await scanSidebar(config)

		const docs: Record<string, PetitDataDocument> = {}
		for (const category of sidebar) {
			for (const entry of category.entries) {
				const parsed = await parseDocument(entry.filePath)
				docs[entry.slug] = {
					html: parsed.html,
					frontmatter: parsed.frontmatter,
					headings: parsed.headings,
				}
			}
		}

		const data: PetitData = {
			config: {
				title: config.title,
				defaultScheme: config.defaultScheme,
				schemeSwitcher: config.schemeSwitcher,
				theme: config.theme,
				themeOverrides: config.themeOverrides,
			},
			sidebar: sidebar.map(cat => ({
				label: cat.label,
				entries: cat.entries.map(e => ({
					label: e.label,
					slug: e.slug,
					draft: e.draft,
				})),
			})),
			docs,
		}

		const appRoot = resolveAppRoot()
		await writeData(appRoot, data)

		const totalEntries = sidebar.reduce(
			(sum, category) => sum + category.entries.length,
			0,
		)

		const port = await getPort({ port: 4321 })
		console.log(`[petit] Loaded config: ${config.title}`)
		console.log(`[petit] Found ${sidebar.length} categories, ${totalEntries} documents`)
		console.log(`[petit] Starting dev server on http://localhost:${port}`)

		const child = spawn("npx", ["vite", "dev", "--port", String(port)], {
			cwd: appRoot,
			stdio: "inherit",
			shell: process.platform === "win32",
		})

		child.on("error", (err) => {
			console.error(`[petit] Failed to start dev server: ${err.message}`)
			process.exit(1)
		})

		child.on("exit", (code) => {
			process.exit(code ?? 0)
		})

		const watcher = watch(
			[
				path.join(config.docsRoot, "**/*.md"),
				path.join(config.docsRoot, "**/*.mdx"),
				config.configPath,
			],
			{
				ignoreInitial: true,
				awaitWriteFinish: { stabilityThreshold: 100 },
			},
		)

		let rebuildTimeout: ReturnType<typeof setTimeout> | null = null

		async function rebuild() {
			try {
				console.log("[petit] Change detected, rebuilding...")
				const newConfig = await loadConfig(args.config || undefined)
				const newSidebar = await scanSidebar(newConfig)
				const newDocs: Record<string, PetitDataDocument> = {}
				for (const category of newSidebar) {
					for (const entry of category.entries) {
						const parsed = await parseDocument(entry.filePath)
						newDocs[entry.slug] = {
							html: parsed.html,
							frontmatter: parsed.frontmatter,
							headings: parsed.headings,
						}
					}
				}
				const newData: PetitData = {
					config: {
						title: newConfig.title,
						defaultScheme: newConfig.defaultScheme,
						schemeSwitcher: newConfig.schemeSwitcher,
						theme: newConfig.theme,
						themeOverrides: newConfig.themeOverrides,
					},
					sidebar: newSidebar.map(cat => ({
						label: cat.label,
						entries: cat.entries.map(e => ({
							label: e.label,
							slug: e.slug,
							draft: e.draft,
						})),
					})),
					docs: newDocs,
				}
				await writeData(appRoot, newData)
				const total = newSidebar.reduce((s, c) => s + c.entries.length, 0)
				console.log(`[petit] Rebuilt ${total} documents`)
			} catch (err) {
				console.error("[petit] Rebuild failed:", err)
			}
		}

		watcher.on("all", () => {
			if (rebuildTimeout) clearTimeout(rebuildTimeout)
			rebuildTimeout = setTimeout(rebuild, 300)
		})
	},
})
