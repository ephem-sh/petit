import type { ResolvedSidebar } from "../sidebar/types"

/**
 * Generate a sitemap.xml string from sidebar entries and a base URL.
 * Only includes non-draft entries.
 */
export function generateSitemap(sidebar: ResolvedSidebar, siteUrl: string): string {
	const base = siteUrl.replace(/\/$/, "")
	const urls: string[] = []

	// Include the root/homepage
	urls.push(
		`  <url>\n    <loc>${escapeXml(base)}</loc>\n  </url>`,
	)

	for (const category of sidebar) {
		for (const entry of category.entries) {
			if (entry.draft) continue
			urls.push(
				`  <url>\n    <loc>${escapeXml(base + "/" + entry.slug)}</loc>\n  </url>`,
			)
		}
	}

	return [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
		...urls,
		`</urlset>`,
	].join("\n")
}

/** Escape special XML characters in a string */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
}
