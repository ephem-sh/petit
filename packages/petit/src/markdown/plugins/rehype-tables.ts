import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"

/**
 * Rehype plugin that wraps `<table>` elements in a scrollable container
 * for responsive table display.
 */
export function rehypeTables() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (
				node.tagName !== "table" ||
				index === undefined ||
				index === null ||
				!parent
			) return

			const wrapper: Element = {
				type: "element",
				tagName: "div",
				properties: { className: ["petit-table-wrap"] },
				children: [node],
			}

			;(parent as Element | Root).children[index] = wrapper
		})
	}
}
