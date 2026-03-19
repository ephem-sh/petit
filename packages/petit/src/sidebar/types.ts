/** A resolved sidebar entry with full metadata */
export interface SidebarEntry {
	/** Display label */
	label: string
	/** URL slug (e.g., "/getting-started/overview") */
	slug: string
	/** Absolute file path to the markdown file */
	filePath: string
	/** Sort order from frontmatter */
	order: number
	/** Whether this is a draft */
	draft: boolean
}

/** A sidebar category containing entries */
export interface SidebarCategory {
	/** Category label (displayed as muted uppercase) */
	label: string
	/** Entries within this category, sorted by order then alphabetically */
	entries: SidebarEntry[]
	/** Nested subcategories */
	children?: SidebarCategory[]
	/** Nesting depth: 0 = top-level, max 3 */
	depth: number
}

/** The full resolved sidebar structure */
export type ResolvedSidebar = SidebarCategory[]
