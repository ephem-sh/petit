import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent } from "hast"

const CALLOUT_TYPES: Record<string, { label: string; className: string }> = {
	NOTE: { label: "Note", className: "petit-callout-note" },
	TIP: { label: "Tip", className: "petit-callout-tip" },
	INFO: { label: "Info", className: "petit-callout-info" },
	WARNING: { label: "Warning", className: "petit-callout-warning" },
	DANGER: { label: "Danger", className: "petit-callout-danger" },
}

/**
 * Rehype plugin that transforms blockquotes with `[!TYPE]` syntax into styled callout blocks.
 */
export function rehypeCallouts() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (node.tagName !== "blockquote" || index === undefined || !parent) return

			const firstP = node.children.find(
				(c): c is Element => c.type === "element" && c.tagName === "p",
			)
			if (!firstP || firstP.children.length === 0) return

			const firstChild = firstP.children[0]
			if (firstChild.type !== "text") return

			const match = /^\[!(NOTE|TIP|INFO|WARNING|DANGER)\]\s*\n?/.exec(firstChild.value)
			if (!match) return

			const calloutType = CALLOUT_TYPES[match[1]]
			if (!calloutType) return

			const remaining = firstChild.value.slice(match[0].length)
			if (remaining) {
				firstP.children[0] = { type: "text", value: remaining }
			} else {
				firstP.children.shift()
			}

			const contentChildren: ElementContent[] = []
			for (const child of node.children) {
				if (child === firstP && firstP.children.length === 0) continue
				contentChildren.push(child)
			}

			const titleChildren: ElementContent[] = [
				{ type: "text", value: calloutType.label },
			]

			const callout: Element = {
				type: "element",
				tagName: "div",
				properties: {
					className: ["petit-callout", calloutType.className],
					role: "note",
				},
				children: [
					{
						type: "element",
						tagName: "div",
						properties: { className: ["petit-callout-title"] },
						children: titleChildren,
					},
					{
						type: "element",
						tagName: "div",
						properties: { className: ["petit-callout-content"] },
						children: contentChildren,
					},
				],
			}

			;(parent as Element | Root).children[index] = callout
		})
	}
}
