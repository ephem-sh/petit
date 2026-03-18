import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { defineCommand } from "citty"
import { loadConfig } from "../config/loader"
import { scanSidebar } from "../sidebar/scanner"
import { parseDocument } from "../markdown/parse"
import { buildSearchIndex, stripHtml } from "../search/indexer"
import { generateOgImages } from "../og/index"
import { optimizeImages } from "../media/optimize"
import { generateSitemap, generateRobots, generateLlmsTxt, generateLlmsFullMd, writeMarkdownFiles } from "../seo/index"
import { getTheme } from "../themes"
import type { SearchDocument } from "../search/types"
import * as log from "./logger"

const VERSION = "0.2.0"

/** Resolve the bundled app directory shipped inside the package */
function resolveAppDir(): string {
	const thisFile = fileURLToPath(import.meta.url)
	return path.resolve(path.dirname(thisFile), "..", "app")
}

/** Find the vite CLI entry point via require.resolve */
function resolveViteBin(): string {
	const req = createRequire(import.meta.url)
	const vitePkg = req.resolve("vite/package.json")
	const viteDir = path.dirname(vitePkg)
	return path.join(viteDir, "bin", "vite.js")
}

/** The `petit build` command -- builds static documentation */
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
		outDir: {
			type: "string",
			description: "Output directory (default: .output)",
			required: false,
		},
	},
	async run({ args }) {
		const startTime = performance.now()
		const userCwd = process.cwd()

		log.banner(VERSION)

		const config = await loadConfig(args.config || undefined)
		const sidebar = await scanSidebar(config)
		const theme = getTheme(config.theme)
		const searchDocs: SearchDocument[] = []
		const rawDocs: Record<string, string> = {}

		const totalEntries = sidebar.reduce((sum, cat) => sum + cat.entries.filter(e => !e.draft).length, 0)
		log.info(`${config.title}`)
		log.info(`${totalEntries} document${totalEntries !== 1 ? "s" : ""}, ${sidebar.length} categor${sidebar.length !== 1 ? "ies" : "y"}`)

		for (const category of sidebar) {
			for (const entry of category.entries) {
				if (entry.draft) continue

				const parsed = await parseDocument(entry.filePath, { shikiThemes: { light: theme.shiki.light, dark: theme.shiki.dark } })
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

		await buildSearchIndex(searchDocs)
		log.success("markdown parsed, search index built")

		// Output directory for static assets (SEO files, OG images)
		const outputDir = path.resolve(userCwd, args.outDir ?? ".output", "public")
		if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

		// Generate SEO assets
		if (config.siteUrl) {
			const sitemapXml = generateSitemap(sidebar, config.siteUrl)
			writeFileSync(path.join(outputDir, "sitemap.xml"), sitemapXml, "utf-8")

			const robotsTxt = generateRobots(config.siteUrl)
			writeFileSync(path.join(outputDir, "robots.txt"), robotsTxt, "utf-8")

			const llmsTxt = generateLlmsTxt(sidebar, config.siteUrl, config.title)
			writeFileSync(path.join(outputDir, "llms.txt"), llmsTxt, "utf-8")

			const docsWithRaw: Record<string, { raw: string; frontmatter: { title?: string; description?: string } }> = {}
			for (const category of sidebar) {
				for (const entry of category.entries) {
					if (entry.draft) continue
					docsWithRaw[entry.slug] = {
						raw: rawDocs[entry.slug] ?? "",
						frontmatter: { title: entry.label },
					}
				}
			}

			const llmsFullMd = generateLlmsFullMd(sidebar, docsWithRaw, config.title)
			writeFileSync(path.join(outputDir, "llms-full.md"), llmsFullMd, "utf-8")

			writeMarkdownFiles(sidebar, docsWithRaw, outputDir)
			log.success("SEO assets generated")

			// Generate OG images
			try {
				await generateOgImages({
					sidebar,
					docs: Object.fromEntries(
						sidebar.flatMap(cat =>
							cat.entries.filter(e => !e.draft).map(e => [e.slug, { frontmatter: { title: e.label } }])
						),
					) as Record<string, { frontmatter: { title?: string; description?: string } }>,
					siteName: config.title,
					outDir: outputDir,
					bgColor: theme.dark.background,
					fgColor: theme.dark.foreground,
					mutedColor: theme.dark["muted-foreground"],
				})
				log.success("OG images generated")
			} catch (err) {
				log.warn(`OG images skipped: ${err instanceof Error ? err.message : String(err)}`)
			}
		}

		// Optimize media images
		try {
			await optimizeImages(config.mediaRoot, outputDir)
			log.success("images optimized")
		} catch (err) {
			log.warn(`image optimization skipped: ${err instanceof Error ? err.message : String(err)}`)
		}

		// Build with vite
		const appDir = resolveAppDir()

		const viteBin = resolveViteBin()
		const viteConfig = path.join(appDir, "vite.config.ts")

		const child = spawn(process.execPath, [viteBin, "build", "--config", viteConfig], {
			cwd: appDir,
			stdio: ["inherit", "pipe", "pipe"],
			env: {
				...process.env,
				PETIT_CONFIG_PATH: config.configPath,
				PETIT_USER_CWD: userCwd,
			},
		})

		// Capture vite build output, suppress noise
		child.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			for (const line of text.split("\n")) {
				const clean = line.replace(/\x1b\[[0-9;]*m/g, "").trim()
				if (!clean) continue
				if (clean.startsWith("[petit]")) continue
				if (clean.startsWith("vite v")) continue
				if (clean.includes("building")) continue
				if (clean.includes("transforming")) continue
				if (clean.includes("rendering chunks")) continue
				if (clean.includes("computing gzip")) continue
				if (clean.includes("built in")) continue
				if (clean.includes("Generated")) continue
				if (clean.includes("nitro")) continue
				if (clean.includes("vite preview")) continue
				if (clean.includes("modules transformed")) continue
				if (clean.includes("Tracing dependencies")) continue
				if (clean.includes("Traced")) continue
				if (clean.includes("Ensure your production")) continue
				if (clean.startsWith("- ") && /\(\d/.test(clean)) continue
				if (/\d+\.\d+\s*kB/.test(clean)) continue
				if (/\d+\.\d+\s*KB/.test(clean)) continue
				if (clean.includes("use client")) continue
				if (clean.includes("was ignored")) continue
				if (clean.includes("chunks are larger than")) continue
				if (clean.includes("dynamic import()")) continue
				if (clean.includes("manualChunks")) continue
				if (clean.includes("chunkSizeWarningLimit")) continue
				if (clean.includes("imported from external module")) continue
				// Pass through anything unexpected
				console.log(line)
			}
		})

		child.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			for (const line of text.split("\n")) {
				const clean = line.replace(/\x1b\[[0-9;]*m/g, "").trim()
				if (!clean) continue
				if (clean.includes("DeprecationWarning") || clean.includes("--trace-deprecation")) continue
				if (clean.includes("use client")) continue
				if (clean.includes("was ignored")) continue
				if (clean.includes("Module level directives")) continue
				if (clean.includes("chunks are larger than")) continue
				if (clean.includes("dynamic import()")) continue
				if (clean.includes("manualChunks")) continue
				if (clean.includes("chunkSizeWarningLimit")) continue
				if (clean.includes("imported from external module")) continue
				if (clean.includes("never used in")) continue
				if (clean.startsWith("(!)")) continue
				if (clean.startsWith("- ") && clean.includes("(")) continue
				if (clean.includes("tslib")) continue
				process.stderr.write(line + "\n")
			}
		})

		child.on("error", (err) => {
			log.error(`Build failed: ${err.message}`)
			process.exit(1)
		})

		child.on("exit", (code) => {
			if (code === 0) {
				const elapsed = ((performance.now() - startTime) / 1000).toFixed(1)
				const relOut = path.relative(userCwd, outputDir)
				log.buildDone(relOut, `${elapsed}s`)
			} else {
				log.error("Build failed")
			}
			process.exit(code ?? 0)
		})
	},
})
