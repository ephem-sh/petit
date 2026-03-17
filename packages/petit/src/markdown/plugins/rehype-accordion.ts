import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent, Properties } from "hast"
import { parseSections, inlineMarkdown } from "./parse-sections"

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
 * Rehype plugin that transforms code blocks with language `accordion`
 * into native `<details>/<summary>` accordion elements.
 * Must run before shiki to prevent accordion content from being syntax highlighted.
 */
export function rehypeAccordion() {
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
				(c): c is string => typeof c === "string" && c === "language-accordion",
			)
			if (!hasLang) return

			const rawText = codeEl.children.map(extractText).join("").trim()
			const sections = parseSections(rawText)

			const items: ElementContent[] = sections.map((section) => {
				const paragraphs = section.content.split("\n\n").filter(Boolean)
				const contentChildren: ElementContent[] = paragraphs.map((p) =>
					el("p", {}, [
						{ type: "raw", value: inlineMarkdown(p.trim()) } as unknown as ElementContent,
					]),
				)

				return el("details", { className: ["petit-accordion-item"] }, [
					el("summary", { className: ["petit-accordion-trigger"] }, [
						{ type: "text", value: section.title },
					]),
					el("div", { className: ["petit-accordion-content"] }, [
						el("div", { className: ["petit-accordion-content-inner"] }, contentChildren),
					]),
				])
			})

			const wrapper: Element = el("div", { className: ["petit-accordion"] }, items)

			;(parent as Element | Root).children[index] = wrapper
		})
	}
}
