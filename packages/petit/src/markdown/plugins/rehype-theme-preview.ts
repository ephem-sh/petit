import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"

/**
 * Rehype plugin that transforms `theme-preview` code fences into
 * a placeholder div that gets hydrated client-side.
 */
export function rehypeThemePreview() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (node.tagName !== "pre" || index === undefined || !parent) return

			const codeEl = node.children.find(
				(c): c is Element => c.type === "element" && c.tagName === "code",
			)
			if (!codeEl) return

			const className = codeEl.properties?.className
			if (!Array.isArray(className)) return
			if (!className.some((c) => c === "language-theme-preview")) return

			const placeholder: Element = {
				type: "element",
				tagName: "div",
				properties: { "data-petit-theme-preview": "true" },
				children: [],
			}

			;(parent as Element | Root).children[index] = placeholder
		})
	}
}
