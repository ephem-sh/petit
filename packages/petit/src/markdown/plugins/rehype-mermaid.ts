import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent } from "hast"

/** Extract plain text from a hast node tree */
function extractText(node: ElementContent): string {
	if (node.type === "text") return node.value
	if (node.type === "element") return node.children.map(extractText).join("")
	return ""
}

/**
 * Rehype plugin that transforms code blocks with language `mermaid`
 * into a container for client-side mermaid.js rendering.
 * Must run before shiki to prevent mermaid code from being syntax highlighted.
 */
export function rehypeMermaid() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (
				node.tagName !== "pre" ||
				index === undefined ||
				index === null ||
				!parent
			) return

			const codeEl = node.children.find(
				(c): c is Element => c.type === "element" && c.tagName === "code",
			)
			if (!codeEl) return

			const className = codeEl.properties?.className
			if (!Array.isArray(className)) return

			const hasMermaidLang = className.some(
				(c): c is string => typeof c === "string" && c === "language-mermaid",
			)
			if (!hasMermaidLang) return

			const source = codeEl.children.map(extractText).join("").trim()

			const wrapper: Element = {
				type: "element",
				tagName: "div",
				properties: {
					className: ["petit-mermaid"],
					"data-mermaid-source": source,
				},
				children: [
					{
						type: "element",
						tagName: "pre",
						properties: { className: ["petit-mermaid-fallback"] },
						children: [
							{
								type: "element",
								tagName: "code",
								properties: {},
								children: [{ type: "text", value: source }],
							},
						],
					},
				],
			}

			;(parent as Element | Root).children[index] = wrapper
		})
	}
}
