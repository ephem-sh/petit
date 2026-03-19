import { defineConfig } from "tsup"
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve, join, extname } from "node:path"

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
		// Add correct @source directives for bundled app
		css = css.replace(
			'@plugin "@tailwindcss/typography";',
			'@plugin "@tailwindcss/typography";\n@source "../../**/*.{ts,tsx}";\n@source "../**/*.{ts,tsx}";',
		)
		writeFileSync(globalsCss, css, "utf-8")

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
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"
import { petitPlugin } from "../vite/plugin.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
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
