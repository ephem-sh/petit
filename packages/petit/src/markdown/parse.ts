import { readFile } from "node:fs/promises"
import matter from "gray-matter"
import { createProcessor, type ProcessorOptions } from "./pipeline"
import type { ParsedDocument, DocumentFrontmatter, DocumentHeading } from "./types"

/** Options for parsing a markdown document */
export interface ParseDocumentOptions {
	/** Shiki theme names for light and dark code highlighting */
	shikiThemes?: { light: string; dark: string }
	/** Directory portion of the document slug for resolving relative links */
	slugDir?: string
}

/** Parse a markdown or mdx file into a structured document with HTML, frontmatter, and headings */
export async function parseDocument(filePath: string, options?: ParseDocumentOptions): Promise<ParsedDocument> {
	const source = await readFile(filePath, "utf-8")
	const { data, content } = matter(source)

	const processorOptions: ProcessorOptions | undefined = options?.shikiThemes
		? { shikiThemes: options.shikiThemes }
		: undefined
	const processor = createProcessor(processorOptions)
	const vfile = await processor.process({ value: content, data: { slugDir: options?.slugDir } })

	const frontmatter: DocumentFrontmatter = {
		title: typeof data.title === "string" ? data.title : undefined,
		description: typeof data.description === "string" ? data.description : undefined,
		order: typeof data.order === "number" ? data.order : undefined,
		draft: typeof data.draft === "boolean" ? data.draft : undefined,
		updated: typeof data.updated === "string" ? data.updated : data.updated instanceof Date ? data.updated.toISOString().split("T")[0] : undefined,
	}

	const headings = (
		Array.isArray(vfile.data.headings) ? vfile.data.headings : []
	) as DocumentHeading[]

	return {
		frontmatter,
		html: String(vfile),
		raw: content,
		headings,
	}
}
