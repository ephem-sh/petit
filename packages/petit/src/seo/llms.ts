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

/** Minimal sidebar entry shape needed for LLM file generation */
interface LlmSidebarEntry {
	/** Display label */
	label: string
	/** URL slug */
	slug: string
	/** Whether this entry is a draft */
	draft: boolean
}

/** Minimal sidebar category shape needed for LLM file generation */
interface LlmSidebarCategory {
	/** Category label */
	label: string
	/** Entries within the category */
	entries: LlmSidebarEntry[]
}

/**
 * Generate llms.txt (or llms.md) — a machine-readable index of the documentation.
 * Follows the llms.txt standard for AI agent discoverability. The `ext` parameter
 * controls the extension used for per-page links and the full-documentation pointer,
 * so the emitted file cross-links to files with the matching extension.
 *
 * @param sidebar - Resolved sidebar categories and entries
 * @param siteUrl - Base site URL used to build absolute links
 * @param siteTitle - Site title used in headings and prose
 * @param ext - Link extension: "txt" links to `.txt` files, "md" links to `.md` files
 * @returns The generated llms index as a string
 */
export function generateLlmsTxt(
	sidebar: LlmSidebarCategory[],
	siteUrl: string,
	siteTitle: string,
	ext: "txt" | "md",
): string {
	const base = siteUrl.replace(/\/$/, "")
	const lines: string[] = [
		`# ${siteTitle}`,
		"",
		`> ${siteTitle} documentation`,
		"",
		`This file lists all documentation pages for ${siteTitle}.`,
		`For the full documentation in a single file, see: ${base}/llms-full.${ext}`,
		"",
		"## Docs",
		"",
	]

	for (const category of sidebar) {
		for (const entry of category.entries) {
			if (entry.draft) continue
			lines.push(`- [${entry.label}](${base}/${entry.slug}.${ext})`)
		}
	}

	lines.push("")
	return lines.join("\n")
}

/**
 * Generate llms-full documentation — all documentation concatenated in sidebar order.
 * Each document is separated by a heading and horizontal rule. The produced bytes are
 * identical regardless of extension and are written to both `llms-full.txt` and
 * `llms-full.md`.
 *
 * @param sidebar - Resolved sidebar categories and entries
 * @param docs - Map of slug to document raw content and frontmatter
 * @param siteTitle - Site title used in the top-level heading
 * @returns The concatenated documentation as a string
 */
export function generateLlmsFullMd(
	sidebar: LlmSidebarCategory[],
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
