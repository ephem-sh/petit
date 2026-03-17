import { readdir, readFile } from "node:fs/promises"
import { join, basename, extname } from "node:path"
import matter from "gray-matter"
import type { ResolvedConfig } from "../config/types"
import type { ResolvedSidebar, SidebarCategory, SidebarEntry } from "./types"

/** Convert a kebab-case filename to title case (e.g., "getting-started" -> "Getting Started") */
function kebabToTitle(name: string): string {
	return name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

/** Read frontmatter from a markdown file without processing the full document */
async function readFrontmatter(
	filePath: string,
): Promise<{ title?: string; order?: number; draft?: boolean }> {
	const source = await readFile(filePath, "utf-8")
	const { data } = matter(source)
	return {
		title: typeof data.title === "string" ? data.title : undefined,
		order: typeof data.order === "number" ? data.order : undefined,
		draft: typeof data.draft === "boolean" ? data.draft : undefined,
	}
}

/** Scan the docs directory and build the resolved sidebar structure from config */
export async function scanSidebar(
	config: ResolvedConfig,
): Promise<ResolvedSidebar> {
	const categories: ResolvedSidebar = []

	for (const item of config.sidebar) {
		if (!item.path) {
			const category: SidebarCategory = {
				label: item.label,
				entries: [],
			}
			categories.push(category)
			continue
		}

		const dirPath = join(config.docsRoot, item.path)

		let files: string[]
		try {
			const dirEntries = await readdir(dirPath, { withFileTypes: true })
			files = dirEntries
				.filter((entry) => {
					if (!entry.isFile()) return false
					const ext = extname(entry.name).toLowerCase()
					return ext === ".md" || ext === ".mdx"
				})
				.map((entry) => entry.name)
		} catch {
			console.warn(
				`[petit] sidebar directory not found, skipping: ${dirPath}`,
			)
			categories.push({ label: item.label, entries: [] })
			continue
		}

		const entries: SidebarEntry[] = []

		for (const file of files) {
			const filePath = join(dirPath, file)
			const nameWithoutExt = basename(file, extname(file))
			const fm = await readFrontmatter(filePath)

			entries.push({
				label: fm.title ?? kebabToTitle(nameWithoutExt),
				slug: `${item.path}/${nameWithoutExt}`.replace(/^\.\//, "").replace(/\/+/g, "/"),
				filePath,
				order: fm.order ?? Infinity,
				draft: fm.draft ?? false,
			})
		}

		entries.sort((a, b) => {
			if (a.order !== b.order) return a.order - b.order
			return a.label.localeCompare(b.label)
		})

		categories.push({ label: item.label, entries })
	}

	return categories
}
