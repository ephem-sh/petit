import { existsSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { watch } from "chokidar"
import type { Plugin } from "vite"
import { findConfigFile, loadConfig } from "../config/loader"
import { scanSidebar } from "../sidebar/scanner"
import type { SidebarCategory as ResolvedCategory, SidebarEntry } from "../sidebar/types"
import { parseDocument } from "../markdown/parse"
import type { ResolvedConfig } from "../config/types"
import type { ParsedDocument } from "../markdown/types"
import { getTheme, getThemeNames } from "../themes"
import { generateThemeCSS, generateProseCSS } from "../themes/generate-css"
import { buildSearchIndex, stripHtml } from "../search/indexer"
import type { SerializedSearchIndex } from "../search/types"
import { loadCache, saveCache, isCached, getCached, setCached } from "../cache/index"
import { generateLlmsTxt, generateLlmsFullMd } from "../seo/llms"

/** Profiling timer - only logs when PETIT_PROFILING env is set */
const profiling = process.env.PETIT_PROFILING === "1"
function perf(label: string): () => void {
	if (!profiling) return () => {}
	const start = performance.now()
	return () => {
		const ms = (performance.now() - start).toFixed(1)
		console.log(`[petit:perf] ${label}: ${ms}ms`)
	}
}

/**
 * Walk up from a directory to find the repository root.
 * Tries multiple markers in priority order:
 * 1. .git directory or file (standard git, worktrees)
 * 2. Lock files (bun.lockb, pnpm-lock.yaml, yarn.lock, package-lock.json)
 * 3. Root config markers (.gitignore, turbo.json, nx.json)
 * 4. Agentic markers (.claude, .cursor, .agents)
 *
 * If no marker is found, returns undefined and filePath falls back
 * to being relative to docsRoot.
 */
function findRepoRoot(startDir: string): string | undefined {
	const markers = [
		// Tier 1: git
		[".git"],
		// Tier 2: lock files (always at repo root)
		["bun.lockb", "pnpm-lock.yaml", "yarn.lock", "package-lock.json"],
		// Tier 3: root config
		[".gitignore", "turbo.json", "nx.json"],
		// Tier 4: agentic / editor
		[".claude", ".cursor", ".agents"],
	]

	// Walk up once, checking all tiers at each level (highest tier wins)
	let dir = path.resolve(startDir)
	const { root: fsRoot } = path.parse(dir)
	const candidates: Array<{ dir: string; tier: number }> = []

	while (true) {
		for (let tier = 0; tier < markers.length; tier++) {
			for (const marker of markers[tier]) {
				if (existsSync(path.join(dir, marker))) {
					candidates.push({ dir, tier })
				}
			}
		}
		if (dir === fsRoot) break
		dir = path.dirname(dir)
	}

	if (candidates.length === 0) return undefined

	// Return the best match: lowest tier number wins, deepest dir breaks ties
	candidates.sort((a, b) => a.tier - b.tier)
	return candidates[0].dir
}


/** Serialized sidebar category for the virtual module */
interface SerializedSidebarCategory {
	label: string
	entries: Array<{ label: string; slug: string; draft: boolean }>
	children?: SerializedSidebarCategory[]
	depth: number
}

/** In-memory state holding config, sidebar, and parsed documents */
interface PetitState {
	config: ResolvedConfig
	sidebar: SerializedSidebarCategory[]
	docs: Record<
		string,
		{
			html: string
			raw: string
			filePath: string
			frontmatter: ParsedDocument["frontmatter"]
			headings: ParsedDocument["headings"]
			lastModified: string
		}
	>
}

/** Recursively collect all sidebar entries from nested categories */
function collectAllEntries(categories: ResolvedCategory[]): SidebarEntry[] {
	const result: SidebarEntry[] = []
	for (const cat of categories) {
		result.push(...cat.entries)
		if (cat.children) {
			result.push(...collectAllEntries(cat.children))
		}
	}
	return result
}

/** Recursively serialize a sidebar category for the virtual module */
function serializeCategory(cat: ResolvedCategory): SerializedSidebarCategory {
	return {
		label: cat.label,
		entries: cat.entries.map((e) => ({
			label: e.label,
			slug: e.slug,
			draft: e.draft,
		})),
		...(cat.children?.length ? {
			children: cat.children.map(serializeCategory),
		} : {}),
		depth: cat.depth,
	}
}

/** Load config, scan sidebar, and parse all documents into memory */
async function buildState(configPath: string, useCache = true, userCwd?: string): Promise<PetitState> {
	const endTotal = perf("buildState total")

	const endConfig = perf("loadConfig + scanSidebar")
	const config = await loadConfig(configPath)
	const theme = getTheme(config.theme)
	const sidebar = await scanSidebar(config)
	endConfig()

	const docs: PetitState["docs"] = {}
	const cacheKey = `${theme.shiki.light}:${theme.shiki.dark}`

	const endCache = perf("cache load")
	const cache = useCache ? loadCache(cacheKey) : {}
	endCache()

	// Find repo root to compute repo-relative file paths
	const repoRoot = findRepoRoot(userCwd ?? config.docsRoot)
	if (!repoRoot && config.repository) {
		console.warn("[petit] Could not detect repo root for GitHub links. Initialize git or add a .gitignore at your project root.")
	}

	const allEntries = collectAllEntries(sidebar)

	const endParse = perf(`parse ${allEntries.length} documents`)
	let cacheHits = 0
	let cacheMisses = 0
	for (const entry of allEntries) {
		const fileContent = readFileSync(entry.filePath, "utf-8")
		let parsed: ParsedDocument

		if (useCache && isCached(cache, entry.filePath, fileContent)) {
			parsed = getCached(cache, entry.filePath)!
			cacheHits++
		} else {
			const slugDir = entry.slug.includes("/") ? entry.slug.slice(0, entry.slug.lastIndexOf("/")) : ""
			parsed = await parseDocument(entry.filePath, { shikiThemes: { light: theme.shiki.light, dark: theme.shiki.dark }, slugDir })
			if (useCache) setCached(cache, entry.filePath, fileContent, parsed)
			cacheMisses++
		}

		const lastModified = parsed.frontmatter.updated
			?? statSync(entry.filePath).mtime.toISOString()

		docs[entry.slug] = {
			html: parsed.html,
			raw: parsed.raw,
			frontmatter: parsed.frontmatter,
			headings: parsed.headings,
			filePath: (() => {
				const rel = repoRoot
					? path.relative(repoRoot, entry.filePath).replace(/\\/g, "/")
					: path.relative(config.docsRoot, entry.filePath).replace(/\\/g, "/")
				return rel.replace(/^\.petit\//, "")
			})(),
			lastModified,
		}
	}
	endParse()

	if (profiling) {
		console.log(`[petit:perf] cache: ${cacheHits} hits, ${cacheMisses} misses`)
	}

	const endSave = perf("cache save")
	if (useCache) saveCache(cache, cacheKey)
	endSave()

	endTotal()

	return {
		config,
		sidebar: sidebar.map(serializeCategory),
		docs,
	}
}

/** Recursively flatten serialized sidebar into entry/category pairs */
function flattenSidebarEntries(categories: SerializedSidebarCategory[]): Array<{ entry: { label: string; slug: string; draft: boolean }; categoryLabel: string }> {
	const result: Array<{ entry: { label: string; slug: string; draft: boolean }; categoryLabel: string }> = []
	for (const cat of categories) {
		for (const entry of cat.entries) {
			result.push({ entry, categoryLabel: cat.label })
		}
		if (cat.children) {
			result.push(...flattenSidebarEntries(cat.children))
		}
	}
	return result
}

/** Compute the serialized search index from the current state */
async function computeSearchIndex(st: PetitState): Promise<SerializedSearchIndex | null> {
	const searchDocs: Array<{
		slug: string
		title: string
		description: string
		content: string
		category: string
		headingId: string
	}> = []
	for (const { entry, categoryLabel } of flattenSidebarEntries(st.sidebar)) {
		if (entry.draft) continue
		const doc = st.docs[entry.slug]
		if (!doc) continue

		const pageTitle = doc.frontmatter.title ?? entry.label
		const pageContent = stripHtml(doc.html)

		searchDocs.push({
			slug: entry.slug,
			title: pageTitle,
			description: doc.frontmatter.description ?? "",
			content: pageContent,
			category: categoryLabel,
			headingId: "",
		})

		for (const heading of doc.headings) {
			if (heading.depth < 2 || heading.depth > 3) continue
			searchDocs.push({
				slug: entry.slug,
				title: heading.text,
				description: pageTitle,
				content: "",
				category: categoryLabel,
				headingId: heading.id,
			})
		}
	}
	const { serialized } = await buildSearchIndex(searchDocs)
	return serialized
}

/** Options for the petit Vite plugin */
interface PetitPluginOptions {
	/** Absolute or relative path to petit.config.json. When set, skips config search. */
	configPath?: string
	/** Working directory for resolving relative paths. Defaults to Vite root. */
	userCwd?: string
}

/**
 * Vite plugin for petit docs.
 * Finds petit.config.json, loads docs, and serves generated modules
 * as virtual modules via Vite's resolveId/load hooks.
 */
export function petitPlugin(options: PetitPluginOptions = {}): Plugin {
	let state: PetitState | null = null
	let configPath: string | undefined
	let appRoot = ""
	let isDev = false
	let configErrorMessage: string | null = null
	let searchIndexSerialized: SerializedSearchIndex | null = null

	return {
		name: "petit",
		enforce: "pre",

		config() {
			const thisFile = fileURLToPath(import.meta.url)
			const distDir = path.resolve(path.dirname(thisFile), "..")

			// Collect EVERY node_modules ancestor, not just the nearest one.
			// With npm/bun's flat layout the nearest one holds all dependencies,
			// but under pnpm's isolated store the nearest is the package-private
			// node_modules inside .pnpm/<pkg>/, which does NOT contain the other
			// dependencies -- those live in sibling .pnpm/<dep>/node_modules
			// directories. The outer node_modules that holds .pnpm covers them
			// all, so keep walking and allow each level.
			const nodeModulesDirs: string[] = []
			let dir = path.dirname(thisFile)
			while (dir !== path.dirname(dir)) {
				if (path.basename(dir) === "node_modules") nodeModulesDirs.push(dir)
				dir = path.dirname(dir)
			}
			if (nodeModulesDirs.length > 0) {
				return { server: { fs: { allow: nodeModulesDirs } } }
			}

			// Local dev (not inside node_modules): allow repo root, dist/, and node_modules
			const repoRoot = findRepoRoot(distDir)
			const allow = [distDir]
			if (repoRoot) {
				allow.push(repoRoot)
				const nm = path.join(repoRoot, "node_modules")
				if (existsSync(nm)) allow.push(nm)
			}
			return { server: { fs: { allow } } }
		},

		resolveId(id) {
			if (id.startsWith("virtual:petit/")) {
				return "\0" + id
			}
		},

		load(id) {
			if (!id.startsWith("\0virtual:petit/")) return

			const module = id.slice("\0virtual:petit/".length)

			if (!state) {
				switch (module) {
					case "config":
						return `export const config = { title: "petit", defaultScheme: "system", schemeSwitcher: true, theme: "default", themeOverrides: {}, logo: null, logoDark: null, maxWidth: "md", sidebarPosition: "left", toc: true, repository: null, branch: "main", siteUrl: null, favicon: null, shiki: { light: "github-light", dark: "github-dark" } }`
					case "sidebar":
						return `export const sidebar = []`
					case "docs":
						return `export const docs = {}`
					case "error":
						return `export const configError = ${JSON.stringify(configErrorMessage)}`
					case "search":
						return `export const searchIndex = null`
					case "themes":
						return `export const themes = {}`
					case "theme.css":
						return "/* petit — no config */"
					default:
						return null
				}
			}

			switch (module) {
				case "config": {
					const theme = getTheme(state.config.theme)
					let favicon: string | null = null
					for (const candidate of ["favicon.ico", "favicon.png", "favicon.svg", "logo.png"]) {
						const userFavicon = path.join(state.config.mediaRoot, candidate)
						if (existsSync(userFavicon)) {
							favicon = `/${candidate}`
							break
						}
					}
					return `export const config = ${JSON.stringify({
						title: state.config.title,
						defaultScheme: state.config.defaultScheme,
						schemeSwitcher: state.config.schemeSwitcher,
						theme: state.config.theme,
						themeOverrides: state.config.themeOverrides,
						logo: state.config.logoPath
							? "/media/" + path.relative(state.config.mediaRoot, state.config.logoPath).replace(/\\/g, "/")
							: null,
						logoDark: (() => {
							if (!state.config.logoPath) return null
							const ext = path.extname(state.config.logoPath)
							const darkPath = state.config.logoPath.replace(ext, `.dark${ext}`)
							if (!existsSync(darkPath)) return null
							return "/media/" + path.relative(state.config.mediaRoot, darkPath).replace(/\\/g, "/")
						})(),
						maxWidth: state.config.maxWidth,
						sidebarPosition: state.config.sidebarPosition,
						toc: state.config.toc,
						repository: state.config.repository ?? null,
						branch: state.config.branch,
						siteUrl: state.config.siteUrl ?? null,
						favicon,
						credits: state.config.credits,
						shiki: { light: theme.shiki.light, dark: theme.shiki.dark },
					}, null, "\t")}`
				}
				case "sidebar":
					return `export const sidebar = ${JSON.stringify(state.sidebar, null, "\t")}`
				case "docs":
					return `export const docs = ${JSON.stringify(state.docs)}`
				case "error":
					return `export const configError = null`
				case "search":
					return `export const searchIndex = ${JSON.stringify(searchIndexSerialized)}`
				case "themes": {
					const allThemes: Record<string, { light: Record<string, string>; dark: Record<string, string> }> = {}
					for (const name of getThemeNames()) {
						const t = getTheme(name)
						allThemes[name] = {
							light: { ...t.light } as Record<string, string>,
							dark: { ...t.dark } as Record<string, string>,
						}
					}
					return `export const themes = ${JSON.stringify(allThemes)}`
				}
				case "theme.css": {
					const theme = getTheme(state.config.theme)
					return generateThemeCSS(theme, state.config.fonts) + "\n" + generateProseCSS(theme)
				}
				default:
					return null
			}
		},

		async configResolved(viteConfig) {
			appRoot = viteConfig.root
			isDev = viteConfig.command === "serve"

			const explicitConfig = options.configPath || process.env.PETIT_CONFIG_PATH
			if (explicitConfig) {
				const cwd = options.userCwd || process.env.PETIT_USER_CWD || appRoot
				configPath = path.resolve(cwd, explicitConfig)
			} else {
				configPath = findConfigFile(appRoot)
			}

			if (!configPath) {
				configErrorMessage = "No petit.config.json found"
				console.warn("[petit] No petit.config.json found (searched from", appRoot, "upward)")
				return
			}

			console.log("[petit] Found config:", configPath)

			try {
				const effectiveUserCwd = options.userCwd || process.env.PETIT_USER_CWD
				state = await buildState(configPath, !isDev, effectiveUserCwd)
				const endSearch = perf("search index")
				searchIndexSerialized = await computeSearchIndex(state)
				endSearch()
				console.log(`[petit] Loaded ${Object.keys(state.docs).length} documents`)
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err)
				console.error("[petit] Config error:", message)
				configErrorMessage = message
			}
		},

		configureServer(server) {
			if (!state || !configPath) return

			const docsRoot = state.config.docsRoot
			const mediaRoot = state.config.mediaRoot

			if (existsSync(mediaRoot)) {
				const mimeTypes: Record<string, string> = {
					".png": "image/png",
					".jpg": "image/jpeg",
					".jpeg": "image/jpeg",
					".gif": "image/gif",
					".svg": "image/svg+xml",
					".webp": "image/webp",
					".mp4": "video/mp4",
					".webm": "video/webm",
					".ico": "image/x-icon",
				}

				server.middlewares.use("/media", (req, res, next) => {
					const filePath = path.join(mediaRoot, decodeURIComponent(req.url || ""))
					if (existsSync(filePath)) {
						const ext = path.extname(filePath).toLowerCase()
						res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream")
						res.end(readFileSync(filePath))
						return
					}
					next()
				})
			}

			// Serve favicon and manifest.json from memory
			server.middlewares.use((req, res, next) => {
				if (!state || !req.url) return next()
				const url = req.url.replace(/^\//, "")

				if (url === "favicon.ico" || url === "favicon.png" || url === "favicon.svg" || url === "logo.png") {
					const faviconPath = path.join(state.config.mediaRoot, url)
					if (existsSync(faviconPath)) {
						const ext = path.extname(url).toLowerCase()
						const mimeTypes: Record<string, string> = {
							".ico": "image/x-icon",
							".png": "image/png",
							".svg": "image/svg+xml",
						}
						res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream")
						res.end(readFileSync(faviconPath))
						return
					}
				}

				if (url === "manifest.json") {
					let favicon: string | null = null
					for (const candidate of ["favicon.ico", "favicon.png", "favicon.svg", "logo.png"]) {
						if (existsSync(path.join(state.config.mediaRoot, candidate))) {
							favicon = `/${candidate}`
							break
						}
					}
					const manifest = {
						name: state.config.title,
						short_name: state.config.title,
						description: `${state.config.title} documentation`,
						start_url: "/",
						display: "standalone",
						theme_color: "#000000",
						background_color: "#000000",
						icons: [
							...(favicon ? [{ src: favicon, type: favicon.endsWith(".png") ? "image/png" : "image/x-icon", sizes: "any" }] : []),
						],
					}
					res.setHeader("Content-Type", "application/json")
					res.end(JSON.stringify(manifest, null, "\t"))
					return
				}

				next()
			})

			// Serve raw markdown files and LLM index in dev mode
			server.middlewares.use(async (req, res, next) => {
				if (!state || !req.url) return next()
				const url = decodeURIComponent(req.url).replace(/^\//, "")

				// llms-full.txt / llms-full.md — all docs concatenated (identical bytes)
				if (url === "llms-full.txt" || url === "llms-full.md") {
					const body = generateLlmsFullMd(state.sidebar, state.docs, state.config.title)
					res.setHeader(
						"Content-Type",
						url.endsWith(".md") ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8",
					)
					res.end(body)
					return
				}

				// llms.txt / llms.md — LLM discoverability index with matching cross-links
				if (url === "llms.txt" || url === "llms.md") {
					const ext = url.endsWith(".md") ? "md" : "txt"
					const body = generateLlmsTxt(state.sidebar, state.config.siteUrl ?? "", state.config.title, ext)
					res.setHeader(
						"Content-Type",
						ext === "md" ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8",
					)
					res.end(body)
					return
				}

				// OG images — /og/{slug}.png generated on-the-fly in dev
				if (url.startsWith("og/") && url.endsWith(".png")) {
					const filename = url.slice(3, -4) // e.g. "getting-started-overview"
					// Find the doc whose slug, when dashes replace slashes, matches the filename
					const doc = Object.entries(state.docs).find(
						([slug]) => {
							const normalized = slug.includes("/") ? slug.slice(slug.indexOf("/") + 1) : slug
							return normalized.replace(/\//g, "-") === filename
						}
					)?.[1]
					if (doc) {
						try {
							const { generateOgImage } = await import("../og/generator")
							const theme = getTheme(state.config.theme)
							const png = await generateOgImage({
								title: doc.frontmatter.title ?? filename,
								description: doc.frontmatter.description,
								siteName: state.config.title,
								bgColor: theme.dark.background,
								fgColor: theme.dark.foreground,
								mutedColor: theme.dark["muted-foreground"],
							})
							res.setHeader("Content-Type", "image/png")
							res.setHeader("Cache-Control", "no-cache")
							res.end(png)
							return
						} catch (err) {
							console.error("[petit] OG image generation failed:", err)
						}
					}
				}

				// Individual .md / .txt files — {slug}.md and {slug}.txt serve raw markdown
				if (url.endsWith(".md") || url.endsWith(".txt")) {
					const isTxt = url.endsWith(".txt")
					const slug = url.slice(0, -(isTxt ? 4 : 3))
					const doc = state.docs[slug]
					if (doc) {
						const parts: string[] = []
						if (doc.frontmatter.title) {
							parts.push(`# ${doc.frontmatter.title}`)
							if (doc.frontmatter.description) {
								parts.push("", `> ${doc.frontmatter.description}`)
							}
							parts.push("")
						}
						parts.push(doc.raw.trim(), "")
						res.setHeader(
							"Content-Type",
							isTxt ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8",
						)
						res.end(parts.join("\n"))
						return
					}
				}

				next()
			})

			// Watch the configured docs directories, media, and config file.
			// Use an independent chokidar watcher instead of server.watcher
			// because when petit runs via npx/bunx, the Vite root is in a
			// temp directory and server.watcher silently ignores paths outside it.
			//
			// Watch only the doc/media directories, NOT docsRoot (the project
			// root): that would recursively include node_modules and other
			// large trees, overwhelming the watcher and causing missed HMR
			// updates. awaitWriteFinish makes atomic saves (editors that write
			// to a temp file then rename, e.g. VS Code) reliably trigger a
			// rebuild instead of being silently dropped.
			const watchTargets = new Set<string>([configPath])
			for (const item of state.config.sidebar) {
				if (item.path) watchTargets.add(path.resolve(docsRoot, item.path))
			}
			if (existsSync(mediaRoot)) watchTargets.add(mediaRoot)

			const watcher = watch([...watchTargets], {
				ignoreInitial: true,
				ignored: (p: string) => /[/\\](node_modules|\.git|\.petit|\.output|dist|\.vite)([/\\]|$)/.test(p),
				awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
			})

			let debounceTimer: ReturnType<typeof setTimeout> | null = null

			watcher.on("all", (_event: string, filePath: string) => {
				if (!filePath) return
				const norm = path.normalize(filePath)
				const ext = path.extname(norm)
				const isDoc = ext === ".md" || ext === ".mdx"
				const isConfig = norm === path.normalize(configPath!)

				if (!isDoc && !isConfig) return

				if (debounceTimer) clearTimeout(debounceTimer)
				debounceTimer = setTimeout(async () => {
					try {
						console.log("[petit] Change detected, rebuilding...")
						const effectiveUserCwd = options.userCwd || process.env.PETIT_USER_CWD
						state = await buildState(configPath!, false, effectiveUserCwd)
						searchIndexSerialized = await computeSearchIndex(state)

						const virtualModules = ["config", "sidebar", "docs", "error", "search", "themes", "theme.css"]
						for (const mod of virtualModules) {
							const resolved = "\0virtual:petit/" + mod
							const module = server.moduleGraph.getModuleById(resolved)
							if (module) {
								server.moduleGraph.invalidateModule(module)
							}
						}

						server.ws.send({ type: "full-reload" })
						console.log(`[petit] Rebuilt ${Object.keys(state.docs).length} documents`)
					} catch (err) {
						console.error("[petit] Rebuild failed:", err)
					}
				}, 300)
			})

			// Clean up watcher when server closes
			server.httpServer?.on("close", () => {
				watcher.close()
			})
		},
	}
}
