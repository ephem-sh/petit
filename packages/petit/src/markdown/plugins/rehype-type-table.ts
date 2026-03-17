import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent, Properties } from "hast"
import { parseSections } from "./parse-sections"

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

/** Create a hast text node */
function txt(value: string): ElementContent {
	return { type: "text", value }
}

/**
 * Rehype plugin that transforms code blocks with language `type-table`
 * into semantic HTML tables describing type properties.
 * Must run before shiki to prevent table content from being syntax highlighted.
 */
export function rehypeTypeTable() {
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
				(c): c is string => typeof c === "string" && c === "language-type-table",
			)
			if (!hasLang) return

			const rawText = codeEl.children.map(extractText).join("").trim()
			const sections = parseSections(rawText)

			const tableGroups: ElementContent[] = sections.map((section) => {
				const rows = section.content.split("\n").filter(Boolean)

				const headerRow = el("tr", {}, [
					el("th", {}, [txt("Property")]),
					el("th", {}, [txt("Type")]),
					el("th", {}, [txt("Default")]),
					el("th", {}, [txt("Description")]),
				])

				const bodyRows: ElementContent[] = rows.map((row) => {
					const parts = row.split(" | ")
					const name = parts[0]?.trim() ?? ""
					const type = parts[1]?.trim() ?? ""
					const defaultVal = parts[2]?.trim() ?? ""
					const description = parts.slice(3).join(" | ").trim()

					return el("tr", {}, [
						el("td", {}, [el("code", {}, [txt(name)])]),
						el("td", {}, [el("code", {}, [txt(type)])]),
						el("td", {}, [el("code", {}, [txt(defaultVal)])]),
						el("td", {}, [txt(description)]),
					])
				})

				return el("div", { className: ["petit-type-table"] }, [
					el("div", { className: ["petit-type-table-name"] }, [txt(section.title)]),
					el("table", {}, [
						el("thead", {}, [headerRow]),
						el("tbody", {}, bodyRows),
					]),
				])
			})

			const wrapper: Element = tableGroups.length === 1
				? tableGroups[0] as Element
				: el("div", {}, tableGroups)

			;(parent as Element | Root).children[index] = wrapper
		})
	}
}
