import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent, Properties } from "hast"
import { parseSections, inlineMarkdownHast } from "./parse-sections"

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

/**
 * Rehype plugin that transforms code blocks with language `cards`
 * into a grid of linked card elements.
 * Must run before shiki to prevent card content from being syntax highlighted.
 */
export function rehypeCards() {
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

			const hasLang = className.some(
				(c): c is string => typeof c === "string" && c === "language-cards",
			)
			if (!hasLang) return

			const rawText = codeEl.children.map(extractText).join("").trim()
			const sections = parseSections(rawText)

			const cards: ElementContent[] = sections.map((section) => {
				const lines = section.content.split("\n").filter(Boolean)
				const description = lines[0] ?? ""
				const href = lines.find((l) => l.startsWith("/"))

				const cardChildren: ElementContent[] = [
					el("span", { className: ["petit-card-title"] }, [
						{ type: "text", value: section.title },
					]),
					el("span", { className: ["petit-card-description"] }, inlineMarkdownHast(description)),
				]

				if (href) {
					return el("a", { href, className: ["petit-card"] }, cardChildren)
				}
				return el("div", { className: ["petit-card"] }, cardChildren)
			})

			const wrapper: Element = el("div", { className: ["petit-cards"] }, cards)

			;(parent as Element | Root).children.splice(index, 1, wrapper)
		})
	}
}
