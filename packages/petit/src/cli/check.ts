import { existsSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { defineCommand } from "citty"
import { ZodError } from "zod"
import { loadConfig } from "../config/loader"
import { scanSidebar } from "../sidebar/scanner"
import { parseDocument } from "../markdown/parse"
import { getTheme } from "../themes"
import type { ResolvedConfig } from "../config/types"
import type { SidebarCategory, SidebarEntry } from "../sidebar/types"
import * as log from "./logger"

const VERSION = createRequire(import.meta.url)("../../package.json").version as string

/** Flatten a category tree into a single list of entries */
function collectEntries(category: SidebarCategory): SidebarEntry[] {
	const entries = [...category.entries]
	for (const child of category.children ?? []) entries.push(...collectEntries(child))
	return entries
}

/** Directory portion of a slug, used to resolve relative media links */
function slugDirOf(entry: SidebarEntry): string {
	return entry.slug.includes("/") ? entry.slug.slice(0, entry.slug.lastIndexOf("/")) : ""
}

/** The `petit check` command -- validates config and docs without writing anything */
export const checkCommand = defineCommand({
	meta: {
		name: "check",
		description: "Validate petit.config.json and docs without building",
	},
	args: {
		config: {
			type: "string",
			description: "Path to config file",
			required: false,
		},
		docs: {
			type: "boolean",
			description: "Also parse every markdown file to catch content errors",
			required: false,
		},
	},
	async run({ args }) {
		const userCwd = process.cwd()

		log.banner(VERSION)

		let config: ResolvedConfig
		try {
			config = await loadConfig(args.config || undefined)
		} catch (err) {
			if (err instanceof ZodError) {
				log.error("invalid config:")
				for (const issue of err.issues) {
					const at = issue.path.length > 0 ? issue.path.join(".") : "(root)"
					log.error(`  ${at}: ${issue.message}`)
				}
			} else {
				log.error(err instanceof Error ? err.message : String(err))
			}
			log.line()
			process.exit(1)
		}

		log.info(`config ${path.relative(userCwd, config.configPath) || config.configPath}`)
		log.info(`title ${config.title}`)
		log.info(`theme ${config.theme}`)
		log.info(`deploy ${config.deploy}`)

		const warnings: string[] = []

		for (const item of config.sidebar) {
			if (!item.path) continue
			if (!existsSync(path.join(config.docsRoot, item.path))) {
				warnings.push(`"${item.label}" points at a missing directory: ${item.path}`)
			}
		}

		const sidebar = await scanSidebar(config)

		let totalDocs = 0
		let totalDrafts = 0
		const published: SidebarEntry[] = []

		log.line()
		for (const category of sidebar) {
			const entries = collectEntries(category)
			const live = entries.filter((e) => !e.draft)
			const drafts = entries.length - live.length
			totalDocs += live.length
			totalDrafts += drafts
			published.push(...live)
			if (live.length === 0) warnings.push(`category "${category.label}" resolved to 0 documents`)
			log.info(`${category.label} ${live.length} doc${live.length !== 1 ? "s" : ""}${drafts > 0 ? ` (+${drafts} draft)` : ""}`)
		}
		log.info(`total ${totalDocs} document${totalDocs !== 1 ? "s" : ""}, ${totalDrafts} draft${totalDrafts !== 1 ? "s" : ""}`)

		if (!config.siteUrl) {
			warnings.push("no siteUrl: sitemap, robots.txt, llms.txt/llms.md, llms-full and OG images are skipped at build time")
		}

		const failures: { file: string; message: string }[] = []

		if (args.docs) {
			const theme = getTheme(config.theme)
			for (const entry of published) {
				try {
					await parseDocument(entry.filePath, {
						shikiThemes: { light: theme.shiki.light, dark: theme.shiki.dark },
						slugDir: slugDirOf(entry),
					})
				} catch (err) {
					failures.push({
						file: path.relative(userCwd, entry.filePath),
						message: err instanceof Error ? err.message : String(err),
					})
				}
			}
		}

		if (warnings.length > 0) {
			log.line()
			for (const warning of warnings) log.warn(warning)
		}

		log.line()
		if (failures.length > 0) {
			for (const failure of failures) log.error(`${failure.file}: ${failure.message}`)
			log.error(`${failures.length} document${failures.length !== 1 ? "s" : ""} failed to parse`)
			log.line()
			process.exit(1)
		}

		log.success(
			args.docs
				? `config valid, ${totalDocs} document${totalDocs !== 1 ? "s" : ""} parsed`
				: `config valid, ${totalDocs} document${totalDocs !== 1 ? "s" : ""}`,
		)
		log.line()
	},
})
