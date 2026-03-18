import { existsSync, readFileSync } from "node:fs"
import { dirname, parse, resolve } from "node:path"
import { petitConfigSchema } from "./schema"
import type { ResolvedConfig } from "./types"

const CONFIG_FILENAME = "petit.config.json"

/**
 * Find the config file by searching from a starting directory upward.
 * Checks `dir/petit.config.json` and `dir/docs/petit.config.json` at each level.
 */
export function findConfigFile(startDir?: string): string | undefined {
	let dir = resolve(startDir ?? process.cwd())
	const { root: fsRoot } = parse(dir)
	while (true) {
		const candidate = resolve(dir, CONFIG_FILENAME)
		if (existsSync(candidate)) return candidate
		const docsCandidate = resolve(dir, "docs", CONFIG_FILENAME)
		if (existsSync(docsCandidate)) return docsCandidate
		if (dir === fsRoot) break
		dir = dirname(dir)
	}
	return undefined
}

/**
 * Load, validate, and resolve a petit config JSON file.
 *
 * @param configPath - Absolute or relative path to the config file, or a
 *   directory to start searching from. When omitted, searches from cwd upward.
 * @returns Fully resolved configuration with defaults applied.
 */
export async function loadConfig(configPath?: string): Promise<ResolvedConfig> {
	let resolved: string | undefined

	if (configPath) {
		const abs = resolve(configPath)
		if (abs.endsWith(".json") && existsSync(abs)) {
			resolved = abs
		} else {
			// Treat as a directory to search from
			resolved = findConfigFile(abs)
		}
	} else {
		resolved = findConfigFile()
	}

	if (!resolved) {
		throw new Error(
			`No config file found. Expected ${CONFIG_FILENAME} in project root or docs/ directory.`,
		)
	}

	const raw: unknown = JSON.parse(readFileSync(resolved, "utf-8"))
	const parsed = petitConfigSchema.parse(raw)

	const configDir = dirname(resolved)
	const docsRoot = configDir

	let mediaRoot: string
	if (parsed.mediaDir) {
		mediaRoot = resolve(configDir, parsed.mediaDir)
	} else {
		const candidates = [
			resolve(configDir, "docs", "media"),
			resolve(configDir, "media"),
		]
		mediaRoot = candidates.find((c) => existsSync(c)) ?? resolve(configDir, "docs", "media")
	}

	return {
		title: parsed.title,
		defaultScheme: parsed.defaultScheme ?? "system",
		schemeSwitcher: parsed.schemeSwitcher ?? true,
		theme: parsed.theme ?? "default",
		themeOverrides: parsed.themeOverrides ?? {},
		sidebar: parsed.sidebar ?? [],
		configPath: resolved,
		docsRoot,
		logoPath: parsed.logo ? resolve(mediaRoot, parsed.logo.replace(/^\.?\//, "")) : undefined,
		mediaRoot,
		fonts: parsed.fonts,
		maxWidth: parsed.maxWidth ?? "lg",
		sidebarPosition: parsed.sidebarPosition ?? "left",
		toc: parsed.toc ?? true,
		repository: parsed.repository,
		branch: parsed.branch ?? "main",
		siteUrl: parsed.siteUrl,
		deploy: parsed.deploy ?? "node",
	}
}
