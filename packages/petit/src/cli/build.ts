import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { defineCommand } from "citty"
import { loadConfig } from "../config/loader"
import { scanSidebar } from "../sidebar/scanner"
import { parseDocument } from "../markdown/parse"
import { buildSearchIndex, stripHtml } from "../search/indexer"
import { writeData } from "../server/data-writer"
import { generateOgImages } from "../og/index"
import { optimizeImages } from "../media/optimize"
import { generateSitemap, generateRobots, generateLlmsTxt, generateLlmsFullMd, writeMarkdownFiles } from "../seo/index"
import { getTheme } from "../themes"
import type { SearchDocument } from "../search/types"
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

/** The `petit build` command — builds static documentation */
export const buildCommand = defineCommand({
	meta: {
		name: "build",
		description: "Build the documentation site",
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

		const theme = getTheme(config.theme)
		const searchDocs: SearchDocument[] = []
		const docs: Record<string, PetitDataDocument> = {}
		const rawDocs: Record<string, string> = {}

		for (const category of sidebar) {
			for (const entry of category.entries) {
				if (entry.draft) continue

				const parsed = await parseDocument(entry.filePath, { shikiThemes: { light: theme.shiki.light, dark: theme.shiki.dark } })
				docs[entry.slug] = {
					html: parsed.html,
					frontmatter: parsed.frontmatter,
					headings: parsed.headings,
				}
				rawDocs[entry.slug] = parsed.raw

				searchDocs.push({
					slug: entry.slug,
					title: parsed.frontmatter.title ?? entry.label,
					description: parsed.frontmatter.description ?? "",
					content: stripHtml(parsed.html),
					category: category.label,
					headingId: "",
				})

				for (const heading of parsed.headings) {
					if (heading.depth < 2 || heading.depth > 3) continue
					searchDocs.push({
						slug: entry.slug,
						title: heading.text,
						description: parsed.frontmatter.title ?? entry.label,
						content: "",
						category: category.label,
						headingId: heading.id,
					})
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
		await buildSearchIndex(searchDocs)

		console.log(`[petit] Built ${Object.keys(docs).length} documents, search index ready`)

		// Generate SEO assets if siteUrl is configured
		if (config.siteUrl) {
			const appPublic = path.join(appRoot, "public")
			if (!existsSync(appPublic)) mkdirSync(appPublic, { recursive: true })

			// Generate sitemap.xml
			const sitemapXml = generateSitemap(sidebar, config.siteUrl)
			writeFileSync(path.join(appPublic, "sitemap.xml"), sitemapXml, "utf-8")
			console.log("[petit] Generated sitemap.xml")

			// Generate robots.txt
			const robotsTxt = generateRobots(config.siteUrl)
			writeFileSync(path.join(appPublic, "robots.txt"), robotsTxt, "utf-8")
			console.log("[petit] Generated robots.txt")

			// Generate OG images
			const theme = getTheme(config.theme)
			try {
				await generateOgImages({
					sidebar,
					docs,
					siteName: config.title,
					outDir: appPublic,
					bgColor: theme.dark.background,
					fgColor: theme.dark.foreground,
					mutedColor: theme.dark["muted-foreground"],
				})
				console.log("[petit] OG images generated")
			} catch (err) {
				console.warn("[petit] Skipping OG images:", err instanceof Error ? err.message : String(err))
			}

			// Generate llms.txt
			const llmsTxt = generateLlmsTxt(sidebar, config.siteUrl, config.title)
			writeFileSync(path.join(appPublic, "llms.txt"), llmsTxt, "utf-8")
			console.log("[petit] Generated llms.txt")

			// Generate llms-full.md
			const docsWithRaw: Record<string, { raw: string; frontmatter: { title?: string; description?: string } }> = {}
			for (const [slug, doc] of Object.entries(docs)) {
				docsWithRaw[slug] = {
					raw: rawDocs[slug] ?? "",
					frontmatter: doc.frontmatter,
				}
			}
			const llmsFullMd = generateLlmsFullMd(sidebar, docsWithRaw, config.title)
			writeFileSync(path.join(appPublic, "llms-full.md"), llmsFullMd, "utf-8")
			console.log("[petit] Generated llms-full.md")

			// Generate individual .md files
			writeMarkdownFiles(sidebar, docsWithRaw, appPublic)
			console.log("[petit] Generated individual .md files")
		}

		// Optimize media images
		try {
			await optimizeImages(config.mediaRoot, path.join(appRoot, "public"))
			console.log("[petit] Image optimization complete")
		} catch (err) {
			console.warn("[petit] Skipping image optimization:", err instanceof Error ? err.message : String(err))
		}

		console.log(`[petit] Building static site...`)

		const child = spawn("npx", ["vite", "build"], {
			cwd: appRoot,
			stdio: "inherit",
			shell: process.platform === "win32",
		})

		child.on("error", (err) => {
			console.error(`[petit] Failed to build: ${err.message}`)
			process.exit(1)
		})

		child.on("exit", (code) => {
			if (code === 0) {
				console.log(`[petit] Build complete`)
			}
			process.exit(code ?? 0)
		})
	},
})
