import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { generateOgImage } from "./generator"
import type { ResolvedSidebar } from "../sidebar/types"
import type { ParsedDocument } from "../markdown/types"

/**
 * Generate OG images for all non-draft docs and write them to the output directory.
 * Skipped silently if satori or resvg are not available.
 */
export async function generateOgImages(options: {
	sidebar: ResolvedSidebar
	docs: Record<string, { frontmatter: ParsedDocument["frontmatter"] }>
	siteName: string
	outDir: string
	bgColor: string
	fgColor: string
	mutedColor: string
}): Promise<void> {
	const ogDir = path.join(options.outDir, "og")
	if (!existsSync(ogDir)) mkdirSync(ogDir, { recursive: true })

	const slugs: string[] = []
	for (const category of options.sidebar) {
		for (const entry of category.entries) {
			if (entry.draft) continue
			slugs.push(entry.slug)
		}
	}

	for (const slug of slugs) {
		const doc = options.docs[slug]
		if (!doc) continue

		const title = doc.frontmatter.title ?? slug
		const description = doc.frontmatter.description

		const png = await generateOgImage({
			title,
			description,
			siteName: options.siteName,
			bgColor: options.bgColor,
			fgColor: options.fgColor,
			mutedColor: options.mutedColor,
		})

		const filename = slug.replace(/\//g, "-") + ".png"
		writeFileSync(path.join(ogDir, filename), png)
		console.log(`[petit] Generated OG image: og/${filename}`)
	}
}

export { oklchToHex } from "./colors"
export { generateOgImage } from "./generator"
