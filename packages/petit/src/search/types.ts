import type { RawData } from "@orama/orama"

/** A document in the search index */
export interface SearchDocument {
	/** URL slug */
	slug: string
	/** Document title */
	title: string
	/** Document description or first paragraph */
	description: string
	/** Plain text content (HTML stripped) for search */
	content: string
	/** Category label */
	category: string
	/** Heading anchor ID, if this is a section entry (e.g. "installation") */
	headingId: string
}

/** Serialized search index for client-side use */
export type SerializedSearchIndex = RawData
