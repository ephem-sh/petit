import { writeFile } from "node:fs/promises"
import path from "node:path"
import type { ThemeConfig } from "../config/types"
import type { DocumentFrontmatter, DocumentHeading } from "../markdown/types"

/** Serializable sidebar entry for the data file */
export interface PetitDataSidebarEntry {
	/** Display label */
	label: string
	/** URL slug */
	slug: string
	/** Whether this is a draft */
	draft: boolean
}

/** Serializable sidebar category for the data file */
export interface PetitDataSidebarCategory {
	/** Category label */
	label: string
	/** Entries within this category */
	entries: PetitDataSidebarEntry[]
}

/** Serializable document for the data file */
export interface PetitDataDocument {
	/** Rendered HTML string */
	html: string
	/** Frontmatter metadata */
	frontmatter: DocumentFrontmatter
	/** Headings for table of contents */
	headings: DocumentHeading[]
}

/** Shape of the `.petit-data.json` file written to the app root */
export interface PetitData {
	/** Resolved config subset needed by the app */
	config: {
		title: string
		defaultScheme: "dark" | "light" | "system"
		schemeSwitcher: boolean
		theme: string
		themeOverrides: ThemeConfig
	}
	/** Resolved sidebar categories */
	sidebar: PetitDataSidebarCategory[]
	/** Parsed documents keyed by slug */
	docs: Record<string, PetitDataDocument>
}

/**
 * Write the petit data file to the app root directory.
 * The Vite plugin reads this file to serve virtual modules.
 */
export async function writeData(appRoot: string, data: PetitData): Promise<void> {
	await writeFile(path.join(appRoot, ".petit-data.json"), JSON.stringify(data), "utf-8")
}
