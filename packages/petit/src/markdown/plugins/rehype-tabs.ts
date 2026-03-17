import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent, Properties } from "hast"
import { parseSections, inlineMarkdown } from "./parse-sections"

let tabCounter = 0

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
 * Rehype plugin that transforms code blocks with language `tabs`
 * into a generic tabbed interface using radio inputs.
 * Must run before shiki to prevent tab content from being syntax highlighted.
 */
export function rehypeTabs() {
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
				(c): c is string => typeof c === "string" && c === "language-tabs",
			)
			if (!hasLang) return

			const rawText = codeEl.children.map(extractText).join("").trim()
			const sections = parseSections(rawText)
			const uniqueId = `tabs-${++tabCounter}`

			const tabHeaders: ElementContent[] = sections.map((section, i) =>
				el(
					"label",
					{
						className: i === 0
							? ["petit-tab-label", "petit-tab-active"]
							: ["petit-tab-label"],
						"data-tab": `tab-${uniqueId}-${i}`,
					},
					[
						el(
							"input",
							{
								type: "radio",
								name: uniqueId,
								value: `tab-${uniqueId}-${i}`,
								...(i === 0 ? { checked: "" } : {}),
								className: ["sr-only"],
							},
							[],
						),
						{ type: "text", value: section.title },
					],
				),
			)

			const tabPanels: ElementContent[] = sections.map((section, i) => {
				const paragraphs = section.content.split("\n\n").filter(Boolean)
				const contentChildren: ElementContent[] = paragraphs.map((p) =>
					el("p", {}, [
						{ type: "raw", value: inlineMarkdown(p.trim()) } as unknown as ElementContent,
					]),
				)

				return el(
					"div",
					{ className: ["petit-tab-panel"], "data-tab": `tab-${uniqueId}-${i}` },
					contentChildren,
				)
			})

			const wrapper: Element = el(
				"div",
				{
					className: ["petit-tabs"],
					"data-tabs": sections.map((s) => s.title).join(","),
				},
				[
					el("div", { className: ["petit-tabs-header"] }, tabHeaders),
					...tabPanels,
				],
			)

			;(parent as Element | Root).children[index] = wrapper
		})
	}
}
