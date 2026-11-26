import { defineConfig } from "tsup"
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve, join, extname, dirname } from "node:path"
import { z } from "zod"

const petitManifestSchema = z.object({
	name: z.string(),
	version: z.string(),
	dependencies: z.record(z.string(), z.string()),
	devDependencies: z.record(z.string(), z.string()),
})

const installedManifestSchema = z.object({ version: z.string() })

/**
 * Version of a dependency as installed for this package, found the way Node
 * resolves it: the nearest `node_modules/<name>/package.json` walking up from
 * the package root. Throws when it is not installed.
 */
function installedVersion(name: string): string {
	let dir = resolve(".")
	for (;;) {
		const manifest = join(dir, "node_modules", name, "package.json")
		if (existsSync(manifest)) {
			return installedManifestSchema.parse(JSON.parse(readFileSync(manifest, "utf-8"))).version
		}
		const parent = dirname(dir)
		if (parent === dir) {
			throw new Error(`[tsup] ${name} is not installed; run bun install at the repo root`)
		}
		dir = parent
	}
}

/**
 * Exact installed version of every dependency and devDependency of this
 * package, plus this package's own version, so `petit build` writes pinned
 * versions into the scaffolded `.petit/package.json`.
 */
function resolveDepVersions(): Record<string, string> {
	const pkg = petitManifestSchema.parse(JSON.parse(readFileSync(resolve("package.json"), "utf-8")))
	const versions: Record<string, string> = { [pkg.name]: pkg.version }
	for (const name of [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]) {
		versions[name] = installedVersion(name)
	}
	return versions
}

/** Replace one exact substring, failing the build when the source no longer contains it. */
function replaceOnce(source: string, search: string, replacement: string, file: string): string {
	if (!source.includes(search)) throw new Error(`[tsup] expected ${JSON.stringify(search)} in ${file}`)
	return source.replace(search, replacement)
}

/** Recursively rewrite import paths in all .ts/.tsx files under a directory */
function rewriteImports(dir: string): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name)
		if (entry.isDirectory()) {
			rewriteImports(full)
			continue
		}
		const ext = extname(entry.name)
		if (ext !== ".ts" && ext !== ".tsx" && ext !== ".css") continue

		let content = readFileSync(full, "utf-8")
		const original = content

		// Rewrite @/.petit/* -> virtual:petit/*
		content = content.replace(
			/from\s+["']@\/\.petit\/([^"']+)["']/g,
			'from "virtual:petit/$1"',
		)
		content = content.replace(
			/import\s+["']@\/\.petit\/([^"']+)["']/g,
			'import "virtual:petit/$1"',
		)

		// Rewrite @/* -> ./* or ../* (relative to current file position in dist/app/)
		// Since all app source is at dist/app/ root level with components/ and routes/ subdirs:
		// @/components/foo -> ../components/foo (from routes/)
		// @/components/foo -> ./components/foo (from root)
		// The simplest approach: rewrite @/* to paths relative from the file's location
		content = content.replace(
			/from\s+["']@\/([^"']+)["']/g,
			(_match, importPath) => {
				// Calculate relative path from this file to dist/app/src/
				const appSrc = resolve(dir).replace(/\\/g, "/")
				const appRoot = resolve("dist/app").replace(/\\/g, "/")

				// If we're in a subdirectory (routes/, components/), go up
				if (appSrc !== appRoot) {
					const depth = appSrc.slice(appRoot.length + 1).split("/").length
					const prefix = "../".repeat(depth)
					return `from "${prefix}${importPath}"`
				}
				return `from "./${importPath}"`
			},
		)

		// Rewrite @workspace/ui/* -> ./ui/*
		// components/* -> ui/components/*
		// lib/* -> ui/lib/*
		// globals.css -> ui/styles/globals.css
		content = content.replace(
			/from\s+["']@workspace\/ui\/([^"']+)["']/g,
			(_match, importPath) => {
				const appSrc = resolve(dir).replace(/\\/g, "/")
				const appRoot = resolve("dist/app").replace(/\\/g, "/")

				const queryIdx = importPath.indexOf("?")
				const cleanPath = queryIdx >= 0 ? importPath.slice(0, queryIdx) : importPath
				const suffix = queryIdx >= 0 ? importPath.slice(queryIdx) : ""
				let mappedPath = cleanPath
				if (cleanPath === "globals.css") {
					mappedPath = "styles/globals.css"
				}
				mappedPath = mappedPath + suffix

				if (appSrc !== appRoot) {
					const depth = appSrc.slice(appRoot.length + 1).split("/").length
					const prefix = "../".repeat(depth)
					return `from "${prefix}ui/${mappedPath}"`
				}
				return `from "./ui/${mappedPath}"`
			},
		)

		// Also handle CSS imports: @import "...@workspace/ui/..."
		content = content.replace(
			/import\s+["']@workspace\/ui\/([^"']+)["']/g,
			(_match, importPath) => {
				const appSrc = resolve(dir).replace(/\\/g, "/")
				const appRoot = resolve("dist/app").replace(/\\/g, "/")
				const queryIdx = importPath.indexOf("?")
				const cleanPath = queryIdx >= 0 ? importPath.slice(0, queryIdx) : importPath
				const suffix = queryIdx >= 0 ? importPath.slice(queryIdx) : ""
				let mappedPath = cleanPath
				if (cleanPath === "globals.css") {
					mappedPath = "styles/globals.css"
				}
				mappedPath = mappedPath + suffix
				if (appSrc !== appRoot) {
					const depth = appSrc.slice(appRoot.length + 1).split("/").length
					const prefix = "../".repeat(depth)
					return `import "${prefix}ui/${mappedPath}"`
				}
				return `import "./ui/${mappedPath}"`
			},
		)

		if (content !== original) {
			writeFileSync(full, content, "utf-8")
		}
	}
}

export default defineConfig({
	entry: ["src/index.ts", "src/cli/index.ts", "src/vite/plugin.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	target: "node24",
	async onSuccess() {
		// 1. Copy OG fonts
		const fontSrc = resolve("src/og/fonts")
		const fontDest = resolve("dist/og/fonts")
		mkdirSync(fontDest, { recursive: true })
		cpSync(fontSrc, fontDest, { recursive: true })

		// 2. Copy app source files
		const appDest = resolve("dist/app")
		mkdirSync(appDest, { recursive: true })

		// Copy apps/docs/src/ -> dist/app/
		const appSrc = resolve("../../apps/docs/src")
		cpSync(appSrc, appDest, { recursive: true })

		// Remove the .petit directory (we use virtual modules now)
		const petitDir = join(appDest, ".petit")
		try {
			const { rmSync } = await import("node:fs")
			rmSync(petitDir, { recursive: true, force: true })
		} catch {
			// Ignore if doesn't exist
		}

		// 3. Copy packages/ui/src/ -> dist/app/ui/
		const uiSrc = resolve("../../packages/ui/src")
		const uiDest = join(appDest, "ui")
		mkdirSync(uiDest, { recursive: true })
		cpSync(uiSrc, uiDest, { recursive: true })

		// 4. Copy apps/docs/public/ -> dist/app/public/
		const publicSrc = resolve("../../apps/docs/public")
		const publicDest = join(appDest, "public")
		mkdirSync(publicDest, { recursive: true })
		cpSync(publicSrc, publicDest, { recursive: true })

		// 5. Rewrite imports in copied files
		rewriteImports(appDest)

		// Also rewrite the CSS @source directives in globals.css
		const globalsCss = join(uiDest, "styles", "globals.css")
		let css = readFileSync(globalsCss, "utf-8")
		// Remove @source directives that reference monorepo paths
		css = css.replace(/@source\s+"[^"]*";\n?/g, "")
		// Turn off automatic source detection. Its base is the Vite root (.petit/),
		// which also holds the build output: each environment (client, then ssr or
		// the worker) scans whatever the environments before it wrote there, so
		// each emits a different globals css and the SSR <link> names a file the
		// client build never produced. Only the app source below is scanned.
		css = replaceOnce(css, '@import "tailwindcss";', '@import "tailwindcss" source(none);', globalsCss)
		// Add correct @source directives for bundled app
		css = replaceOnce(
			css,
			'@plugin "@tailwindcss/typography";',
			'@plugin "@tailwindcss/typography";\n@source "../../**/*.{ts,tsx}";\n@source "../**/*.{ts,tsx}";',
			globalsCss,
		)
		writeFileSync(globalsCss, css, "utf-8")

		// Pin the scaffold's dependencies to the versions this build was made with
		writeFileSync(resolve("dist/dep-versions.json"), JSON.stringify(resolveDepVersions(), null, "\t"), "utf-8")

		// 6. Copy vite config templates to dist/vite-configs/
		const viteConfigsSrc = resolve("src/vite-configs")
		const viteConfigsDest = resolve("dist/vite-configs")
		mkdirSync(viteConfigsDest, { recursive: true })
		cpSync(viteConfigsSrc, viteConfigsDest, { recursive: true })

		// 7. Copy platform templates to dist/platforms/
		const platformsSrc = resolve("src/platforms")
		const platformsDest = resolve("dist/platforms")
		mkdirSync(platformsDest, { recursive: true })
		cpSync(platformsSrc, platformsDest, { recursive: true })

		// 8. Write vite.config.ts for dev mode (petit dev runs from dist/app/)
		writeFileSync(
			join(appDest, "vite.config.ts"),
			`import path from "node:path"
import os from "node:os"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"
import { petitPlugin } from "../vite/plugin.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Persist Vite's dependency pre-bundle cache in a stable per-project temp
// directory so it survives across runs. When petit runs via npx/bunx the app
// dir is ephemeral, so the default cache (node_modules/.vite next to the app)
// is discarded every run, forcing a cold dependency optimize (~6s) on every
// start. Keying by the user's project path keeps the cache warm across runs
// while isolating separate projects. Vite invalidates it internally when the
// resolved dependencies or config change.
const petitUserCwd = process.env.PETIT_USER_CWD || process.cwd()
const petitCacheKey = crypto.createHash("md5").update(petitUserCwd).digest("hex").slice(0, 12)
const petitCacheDir = path.join(os.tmpdir(), "petit-vite-cache", petitCacheKey)

export default defineConfig({
  cacheDir: petitCacheDir,
  plugins: [
    petitPlugin({
      configPath: process.env.PETIT_CONFIG_PATH,
      userCwd: process.env.PETIT_USER_CWD,
    }),
    nitro(),
    tailwindcss(),
    tanstackStart({ srcDirectory: "." }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "~": __dirname,
    },
  },
})
`,
			"utf-8",
		)

		// 9. Write tsconfig.json for the bundled app
		writeFileSync(
			join(appDest, "tsconfig.json"),
			JSON.stringify(
				{
					compilerOptions: {
						target: "ES2022",
						jsx: "react-jsx",
						module: "ESNext",
						lib: ["ES2022", "DOM", "DOM.Iterable"],
						types: ["vite/client"],
						moduleResolution: "bundler",
						allowImportingTsExtensions: true,
						verbatimModuleSyntax: true,
						noEmit: true,
						skipLibCheck: true,
						strict: true,
						allowJs: true,
						baseUrl: ".",
						paths: {
							"~/*": ["./*"],
						},
					},
					include: ["**/*.ts", "**/*.tsx"],
				},
				null,
				"\t",
			),
			"utf-8",
		)

		// 10. Write type declarations for virtual modules (as .ts to survive DTS clean)
		writeFileSync(
			join(appDest, "petit-env.ts"),
			`/* eslint-disable */
// Virtual module type declarations for petit
// This file provides TypeScript types for virtual:petit/* modules

export {}

declare module "virtual:petit/config" {
	export const config: {
		title: string
		defaultScheme: "dark" | "light" | "system"
		schemeSwitcher: boolean
		theme: string
		themeOverrides: Record<string, unknown>
		logo: string | null
		logoDark: string | null
		maxWidth: "sm" | "md" | "lg" | "xl"
		sidebarPosition: "left" | "right" | "center"
		toc: boolean
		repository: string | null
		branch: string
		siteUrl: string | null
		favicon: string | null
		credits: boolean
		shiki: { light: string; dark: string }
	}
}

declare module "virtual:petit/sidebar" {
	interface SidebarCategory {
		label: string
		entries: Array<{ label: string; slug: string; draft: boolean }>
		children?: SidebarCategory[]
		depth: number
	}
	export const sidebar: Array<SidebarCategory>
}

declare module "virtual:petit/docs" {
	export const docs: Record<
		string,
		{
			html: string
			raw: string
			filePath: string
			frontmatter: {
				title?: string
				description?: string
				order?: number
				draft?: boolean
				updated?: string
			}
			headings: Array<{ depth: number; text: string; id: string }>
			lastModified: string
		}
	>
}

declare module "virtual:petit/error" {
	export const configError: string | null
}

declare module "virtual:petit/search" {
	export const searchIndex: unknown
}

declare module "virtual:petit/themes" {
	export const themes: Record<
		string,
		{ light: Record<string, string>; dark: Record<string, string> }
	>
}

declare module "virtual:petit/theme.css" {}
`,
			"utf-8",
		)

		console.log("[tsup] Copied app source to dist/app/")
	},
})
