import { readFile } from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import { createProcessor, type DocumentFormat, type ProcessorOptions } from "./pipeline"
import type { ParsedDocument, DocumentFrontmatter, DocumentHeading } from "./types"

/** Options for parsing a markdown document */
export interface ParseDocumentOptions {
	/** Shiki theme names for light and dark code highlighting */
	shikiThemes?: { light: string; dark: string }
	/** Directory portion of the document slug for resolving relative links */
	slugDir?: string
}

/**
 * A document failed to parse. Line and column count from the start of the
 * whole file, frontmatter included, so they match what an editor shows.
 */
export class DocumentParseError extends Error {
	/** Absolute path of the document */
	readonly filePath: string
	/** 1-based line in the whole file, or undefined when the parser gave no position */
	readonly line: number | undefined
	/** 1-based column, or undefined when the parser gave no position */
	readonly column: number | undefined
	/** What went wrong, as the parser worded it */
	readonly reason: string
	/** Parser rule that failed, such as `end-tag-mismatch` */
	readonly ruleId: string | undefined
	/** Package that raised it, such as `mdast-util-mdx-jsx` */
	readonly source: string | undefined
	/** Full source text of the file, for printing a code frame */
	readonly fileSource: string

	/** Build the error from its parts; see each field for meaning */
	constructor(fields: {
		filePath: string
		line: number | undefined
		column: number | undefined
		reason: string
		ruleId: string | undefined
		source: string | undefined
		fileSource: string
	}) {
		super(fields.reason)
		this.name = "DocumentParseError"
		this.filePath = fields.filePath
		this.line = fields.line
		this.column = fields.column
		this.reason = fields.reason
		this.ruleId = fields.ruleId
		this.source = fields.source
		this.fileSource = fields.fileSource
	}
}

/** Pick the processor format from the file extension */
function formatOf(filePath: string): DocumentFormat {
	return path.extname(filePath).toLowerCase() === ".mdx" ? "mdx" : "md"
}

/** Fields of a vfile message, read from a thrown value without importing vfile-message */
interface ParserMessage {
	reason: string
	line: number | undefined
	column: number | undefined
	ruleId: string | undefined
	source: string | undefined
}

/** Read a thrown value as a unified/vfile message, or undefined when it is some other error */
function readParserMessage(err: unknown): ParserMessage | undefined {
	if (!(err instanceof Error) || !("reason" in err) || typeof err.reason !== "string") return undefined
	const num = (key: string): number | undefined => {
		const v: unknown = Reflect.get(err, key)
		return typeof v === "number" ? v : undefined
	}
	const str = (key: string): string | undefined => {
		const v: unknown = Reflect.get(err, key)
		return typeof v === "string" ? v : undefined
	}
	return { reason: err.reason, line: num("line"), column: num("column"), ruleId: str("ruleId"), source: str("source") }
}

/** Count newline characters in a string */
function countLines(text: string): number {
	let n = 0
	for (const ch of text) if (ch === "\n") n++
	return n
}

/** Parse a markdown or mdx file into a structured document with HTML, frontmatter, and headings */
export async function parseDocument(filePath: string, options?: ParseDocumentOptions): Promise<ParsedDocument> {
	const source = await readFile(filePath, "utf-8")
	const { data, content } = matter(source)

	const processorOptions: ProcessorOptions | undefined = options?.shikiThemes
		? { shikiThemes: options.shikiThemes }
		: undefined
	const processor = createProcessor(formatOf(filePath), processorOptions)

	let vfile: Awaited<ReturnType<typeof processor.process>>
	try {
		vfile = await processor.process({ value: content, path: filePath, data: { slugDir: options?.slugDir } })
	} catch (thrown) {
		const err = readParserMessage(thrown)
		if (!err) throw thrown
		// gray-matter hands back the body as a suffix of the source; the lines
		// before it are the frontmatter it removed.
		if (!source.endsWith(content)) throw thrown
		const lineOffset = countLines(source.slice(0, source.length - content.length))
		throw new DocumentParseError({
			filePath,
			line: err.line === undefined ? undefined : err.line + lineOffset,
			column: err.column,
			// mdast-util-mdx-jsx names related places in the reason as
			// `(line:col-line:col)`, counted in the body: shift those too.
			reason: err.reason.replace(/\((\d+):(\d+)-(\d+):(\d+)\)/g, (_m, l1: string, c1: string, l2: string, c2: string) =>
				`(${Number(l1) + lineOffset}:${c1}-${Number(l2) + lineOffset}:${c2})`),
			ruleId: err.ruleId,
			source: err.source,
			fileSource: source,
		})
	}

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
