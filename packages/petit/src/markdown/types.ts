/** Parsed document with frontmatter and rendered HTML */
export interface ParsedDocument {
	/** Frontmatter fields */
	frontmatter: DocumentFrontmatter
	/** Rendered HTML string */
	html: string
	/** Raw markdown content (without frontmatter) */
	raw: string
	/** Headings extracted for TOC */
	headings: DocumentHeading[]
}

/** Frontmatter metadata for a document */
export interface DocumentFrontmatter {
	title?: string
	description?: string
	order?: number
	draft?: boolean
	/** User-provided last-updated date (highest priority for lastModified resolution) */
	updated?: string
}

/** A heading extracted from the document for table of contents */
export interface DocumentHeading {
	depth: number
	text: string
	id: string
}
