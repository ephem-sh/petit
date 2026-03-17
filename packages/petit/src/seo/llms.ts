import type { ResolvedSidebar } from "../sidebar/types"

/** Metadata for a document used in LLM file generation */
interface LlmDocMeta {
	/** Raw markdown content (without frontmatter) */
	raw: string
	/** Frontmatter fields */
	frontmatter: {
		title?: string
		description?: string
	}
}

/**
 * Generate llms.txt — a machine-readable index of the documentation.
 * Follows the llms.txt standard for AI agent discoverability.
 */
export function generateLlmsTxt(
	sidebar: ResolvedSidebar,
	siteUrl: string,
	siteTitle: string,
): string {
	const base = siteUrl.replace(/\/$/, "")
	const lines: string[] = [
		`# ${siteTitle}`,
		"",
		`> ${siteTitle} documentation`,
		"",
		`This file lists all documentation pages for ${siteTitle}.`,
		`For the full documentation in a single file, see: ${base}/llms-full.md`,
		"",
		"## Docs",
		"",
	]

	for (const category of sidebar) {
		for (const entry of category.entries) {
			if (entry.draft) continue
			lines.push(`- [${entry.label}](${base}/${entry.slug}.md)`)
		}
	}

	lines.push("")
	return lines.join("\n")
}

/**
 * Generate llms-full.md — all documentation concatenated in sidebar order.
 * Each document is separated by a heading and horizontal rule.
 */
export function generateLlmsFullMd(
	sidebar: ResolvedSidebar,
	docs: Record<string, LlmDocMeta>,
	siteTitle: string,
): string {
	const sections: string[] = [
		`# ${siteTitle} — Full Documentation`,
		"",
	]

	for (const category of sidebar) {
		sections.push(`## ${category.label}`)
		sections.push("")

		for (const entry of category.entries) {
			if (entry.draft) continue
			const doc = docs[entry.slug]
			if (!doc) continue

			const title = doc.frontmatter.title ?? entry.label
			sections.push(`### ${title}`)
			if (doc.frontmatter.description) {
				sections.push("")
				sections.push(`> ${doc.frontmatter.description}`)
			}
			sections.push("")
			sections.push(doc.raw.trim())
			sections.push("")
			sections.push("---")
			sections.push("")
		}
	}

	return sections.join("\n")
}
