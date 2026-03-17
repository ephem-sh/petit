import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"

/**
 * Rehype plugin that makes images responsive by adding lazy loading,
 * rewriting relative media paths, and wrapping images with alt text in figures.
 */
export function rehypeImages() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (
				node.tagName !== "img" ||
				index === undefined ||
				index === null ||
				!parent
			) return

			if (!node.properties) {
				node.properties = {}
			}

			node.properties.loading = "lazy"

			const src = node.properties.src
			if (typeof src === "string") {
				if (src.startsWith("./media/")) {
					node.properties.src = src.slice(1)
				} else if (src.startsWith("media/")) {
					node.properties.src = `/${src}`
				}

				const existing = Array.isArray(node.properties.className) ? node.properties.className : []
				if (src.includes(".dark.")) {
					node.properties.className = [...existing, "petit-dark-only"]
				} else if (src.includes(".light.")) {
					node.properties.className = [...existing, "petit-light-only"]
				}
			}

			const alt = node.properties.alt
			if (typeof alt === "string" && alt.length > 0) {
				const figure: Element = {
					type: "element",
					tagName: "figure",
					properties: { className: ["petit-figure"] },
					children: [
						node,
						{
							type: "element",
							tagName: "figcaption",
							properties: {},
							children: [{ type: "text", value: alt }],
						},
					],
				}

				;(parent as Element | Root).children[index] = figure
			}
		})
	}
}
