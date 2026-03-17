import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent, Properties } from "hast"

/** Extract plain text from a hast node tree */
function extractText(node: ElementContent): string {
	if (node.type === "text") return node.value
	if (node.type === "element") return node.children.map(extractText).join("")
	return ""
}

/** Create a hast element node */
function el(
	tagName: string,
	properties: Properties,
	children: ElementContent[],
): Element {
	return { type: "element", tagName, properties, children }
}

/** Parse a filename from code fence meta (e.g., `config.ts` or `title="config.ts"`) */
function parseTitle(meta: string): string | undefined {
	const trimmed = meta.trim()
	if (!trimmed) return undefined

	// Support explicit title="..." for backwards compat
	const quoted = /title="([^"]+)"/.exec(trimmed)
	if (quoted) return quoted[1]

	// Otherwise treat the whole meta as the filename
	return trimmed
}

/**
 * Rehype plugin that enhances `<pre>` code blocks with:
 * - `data-code` attribute containing raw text for copy-to-clipboard
 * - Filename header when `title=` is present in the code fence meta string
 *
 * Runs AFTER shiki. Reads `data-meta` preserved by `rehypeCodeMeta`.
 */
export function rehypeCodeblock() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (node.tagName !== "pre") return

			const codeEl = node.children.find(
				(c): c is Element => c.type === "element" && c.tagName === "code",
			)

			const rawCode = codeEl
				? codeEl.children.map(extractText).join("")
				: node.children.map(extractText).join("")

			if (!node.properties) {
				node.properties = {}
			}
			node.properties["data-code"] = rawCode

			const meta = (node.properties.dataMeta as string | undefined) ?? ""
			const title = parseTitle(meta)

			if (!title || index === undefined || index === null || !parent) return

			const header: Element = el("div", { className: ["petit-codeblock-header"] }, [
				el("span", { className: ["petit-codeblock-title"] }, [
					{ type: "text", value: title },
				]),
			])

			const wrapper: Element = el("div", { className: ["petit-codeblock"] }, [
				header,
				node,
			])

			;(parent as Element | Root).children.splice(index, 1, wrapper)
		})
	}
}
