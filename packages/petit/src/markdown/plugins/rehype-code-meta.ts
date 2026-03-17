import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"

/**
 * Rehype plugin that preserves code fence meta strings on `<pre>` elements.
 * Must run BEFORE shiki so the meta information survives syntax highlighting.
 *
 * Reads `metastring` or `data-meta` from the `<code>` child and copies it
 * to `data-meta` on the parent `<pre>` element.
 */
export function rehypeCodeMeta() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element) => {
			if (node.tagName !== "pre") return

			const codeEl = node.children.find(
				(c): c is Element => c.type === "element" && c.tagName === "code",
			)
			if (!codeEl) return

			const meta =
				(codeEl.data as Record<string, unknown> | undefined)?.meta as string | undefined ??
				(codeEl.properties?.metastring as string | undefined) ??
				(codeEl.properties?.dataMeta as string | undefined) ??
				""

			if (!meta) return

			node.properties = node.properties ?? {}
			node.properties.dataMeta = meta
		})
	}
}
