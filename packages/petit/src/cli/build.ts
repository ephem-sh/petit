import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
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
import { scaffoldPetitApp } from "./scaffold"
import * as log from "./logger"

const VERSION = createRequire(import.meta.url)("../../package.json").version as string

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

		const petitDir = await scaffoldPetitApp({ userCwd, config })

		const publicDir = path.join(petitDir, "public")
		if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

		if (config.siteUrl) {
			const sitemapXml = generateSitemap(sidebar, config.siteUrl)
			writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapXml, "utf-8")

			const robotsTxt = generateRobots(config.siteUrl)
			writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf-8")

			const llmsTxt = generateLlmsTxt(sidebar, config.siteUrl, config.title)
			writeFileSync(path.join(publicDir, "llms.txt"), llmsTxt, "utf-8")

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
			writeFileSync(path.join(publicDir, "llms-full.md"), llmsFullMd, "utf-8")

			writeMarkdownFiles(sidebar, docsWithRaw, publicDir)
			log.success("SEO assets generated")

			try {
				await generateOgImages({
					sidebar,
					docs: Object.fromEntries(
						sidebar.flatMap(cat =>
							cat.entries.filter(e => !e.draft).map(e => [e.slug, { frontmatter: { title: e.label } }])
						),
					) as Record<string, { frontmatter: { title?: string; description?: string } }>,
					siteName: config.title,
					outDir: publicDir,
					bgColor: theme.dark.background,
					fgColor: theme.dark.foreground,
					mutedColor: theme.dark["muted-foreground"],
				})
				log.success("OG images generated")
			} catch (err) {
				log.warn(`OG images skipped: ${err instanceof Error ? err.message : String(err)}`)
			}
		}

		try {
			await optimizeImages(config.mediaRoot, publicDir)
			log.success("images optimized")
		} catch (err) {
			log.warn(`image optimization skipped: ${err instanceof Error ? err.message : String(err)}`)
		}

		log.info(`deploy target: ${config.deploy}`)

		const viteBin = path.join(petitDir, "node_modules", "vite", "bin", "vite.js")

		const child = spawn(process.execPath, [viteBin, "build"], {
			cwd: petitDir,
			stdio: ["inherit", "pipe", "pipe"],
			env: {
				...process.env,
				PETIT_USER_CWD: userCwd,
			},
		})

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
				if (clean.includes("commonjs--resolver")) continue
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
				if (clean.includes("commonjs--resolver")) continue
				if (clean.includes("resolveId")) continue
				if (clean.includes("options parameter")) continue
				if (clean.includes("wrong module resolutions")) continue
				if (clean.includes("early exit errors")) continue
				if (clean.includes("mixed ES/CommonJS")) continue
				if (clean.includes("can be ignored")) continue
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
				log.buildDone(path.join(".petit", ".output", "public"), `${elapsed}s`)
			} else {
				log.error("Build failed")
			}
			process.exit(code ?? 0)
		})
	},
})
