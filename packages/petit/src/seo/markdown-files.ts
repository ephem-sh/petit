import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import type { ResolvedSidebar } from "../sidebar/types"

/** Metadata for a document used in markdown file generation */
interface MarkdownDocMeta {
	/** Raw markdown content (without frontmatter) */
	raw: string
	/** Frontmatter fields */
	frontmatter: {
		title?: string
		description?: string
	}
}

/**
 * Write individual .md and .txt files for each doc page to the output directory.
 * Files are written at {outDir}/{slug}.md and {outDir}/{slug}.txt with identical
 * content, preserving the slug path structure. The .txt variant lets per-page links
 * in llms.txt resolve.
 */
export function writeMarkdownFiles(
	sidebar: ResolvedSidebar,
	docs: Record<string, MarkdownDocMeta>,
	outDir: string,
): void {
	for (const category of sidebar) {
		for (const entry of category.entries) {
			if (entry.draft) continue
			const doc = docs[entry.slug]
			if (!doc) continue

			const mdPath = path.join(outDir, entry.slug + ".md")
			const fileDir = path.dirname(mdPath)
			if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true })

			const parts: string[] = []
			if (doc.frontmatter.title) {
				parts.push(`# ${doc.frontmatter.title}`)
				if (doc.frontmatter.description) {
					parts.push("")
					parts.push(`> ${doc.frontmatter.description}`)
				}
				parts.push("")
			}
			parts.push(doc.raw.trim())
			parts.push("")

			const content = parts.join("\n")
			writeFileSync(mdPath, content, "utf-8")
			writeFileSync(path.join(outDir, entry.slug + ".txt"), content, "utf-8")
		}
	}
}
