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
 * Rehype plugin that transforms code blocks with language `steps`
 * into a numbered step-by-step guide with visual connectors.
 * Must run before shiki to prevent step content from being syntax highlighted.
 */
export function rehypeSteps() {
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
				(c): c is string => typeof c === "string" && c === "language-steps",
			)
			if (!hasLang) return

			const rawText = codeEl.children.map(extractText).join("").trim()
			const sections = parseSections(rawText)
			const totalSteps = sections.length

			const steps: ElementContent[] = sections.map((section, i) => {
				const stepNumber = i + 1
				const isLast = i === totalSteps - 1

				const indicatorChildren: ElementContent[] = [
					el("span", { className: ["petit-step-number"] }, [
						{ type: "text", value: String(stepNumber) },
					]),
				]

				if (!isLast) {
					indicatorChildren.push(
						el("div", { className: ["petit-step-line"] }, []),
					)
				}

				const paragraphs = section.content.split("\n\n").filter(Boolean)
				const contentChildren: ElementContent[] = [
					el("div", { className: ["petit-step-title"] }, [
						{ type: "text", value: section.title },
					]),
					...paragraphs.map((p) =>
						el("p", {}, [
							{ type: "raw", value: inlineMarkdown(p.trim()) } as unknown as ElementContent,
						]),
					),
				]

				return el("div", { className: ["petit-step"], "data-step": String(stepNumber) }, [
					el("div", { className: ["petit-step-indicator"] }, indicatorChildren),
					el("div", { className: ["petit-step-content"] }, contentChildren),
				])
			})

			const wrapper: Element = el("div", { className: ["petit-steps"] }, steps)

			;(parent as Element | Root).children[index] = wrapper
		})
	}
}
