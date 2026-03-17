import { create, insertMultiple, load, save } from "@orama/orama"
import type { AnyOrama } from "@orama/orama"
import type { SearchDocument, SerializedSearchIndex } from "./types"

const searchSchema = {
	slug: "string",
	title: "string",
	description: "string",
	content: "string",
	category: "string",
	headingId: "string",
} as const

/** Orama instance typed with the search schema */
export type SearchIndex = ReturnType<typeof create<typeof searchSchema>>

/**
 * Build a search index from a list of documents.
 * Returns both the live Orama database and a serialized form for client-side hydration.
 */
export async function buildSearchIndex(documents: SearchDocument[]): Promise<{
	db: SearchIndex
	serialized: SerializedSearchIndex
}> {
	const db = create({ schema: searchSchema })
	await insertMultiple(db, documents)
	const serialized = save(db)
	return { db, serialized }
}

/**
 * Strip HTML tags from a string and collapse whitespace.
 * Useful for converting rendered HTML to plain text for indexing.
 */
export function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&[a-zA-Z0-9#]+;/g, " ")
		.replace(/\s+/g, " ")
		.trim()
}

/**
 * Restore a search index from its serialized form.
 * Use this on the client side to hydrate a pre-built index.
 */
export function restoreSearchIndex(serialized: SerializedSearchIndex): SearchIndex {
	const db = create({ schema: searchSchema })
	load(db as AnyOrama, serialized)
	return db
}
