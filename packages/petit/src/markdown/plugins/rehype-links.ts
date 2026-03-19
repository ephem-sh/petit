import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"
import type { VFile } from "vfile"
import { posix } from "node:path"

/**
 * Rehype plugin that rewrites relative links to absolute paths.
 * Reads the document's directory slug from `file.data.slugDir`.
 * For example, a doc with slug "docs/getting-started/installation"
 * has slugDir "docs/getting-started". A relative link "./overview"
 * becomes "/docs/getting-started/overview".
 */
export function rehypeLinks() {
	return (tree: Root, file: VFile): void => {
		const slugDir = file.data.slugDir
		if (typeof slugDir !== "string") return

		visit(tree, "element", (node: Element) => {
			if (node.tagName !== "a") return

			const href = node.properties?.href
			if (typeof href !== "string") return

			if (
				href.startsWith("/") ||
				href.startsWith("#") ||
				href.startsWith("http://") ||
				href.startsWith("https://") ||
				href.startsWith("mailto:")
			) return

			let resolved = href.replace(/\.mdx?$/, "")

			if (resolved.startsWith("./") || resolved.startsWith("../")) {
				resolved = posix.resolve(`/${slugDir}`, resolved)
			} else {
				resolved = posix.resolve(`/${slugDir}`, `./${resolved}`)
			}

			if (!resolved.startsWith("/")) {
				resolved = `/${resolved}`
			}

			node.properties!.href = resolved
		})
	}
}
