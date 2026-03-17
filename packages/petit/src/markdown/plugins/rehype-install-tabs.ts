import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent, Properties } from "hast"

const PACKAGE_MANAGERS = [
	{ id: "npm", label: "npm", command: "npm install" },
	{ id: "pnpm", label: "pnpm", command: "pnpm add" },
	{ id: "bun", label: "bun", command: "bun add" },
	{ id: "yarn", label: "yarn", command: "yarn add" },
] as const

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

/** Create a hast text node */
function txt(value: string): ElementContent {
	return { type: "text", value }
}

/**
 * Rehype plugin that transforms code blocks with language `install`
 * into tabbed install commands for npm, pnpm, bun, and yarn.
 */
export function rehypeInstallTabs() {
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

			const hasInstallLang = className.some(
				(c): c is string => typeof c === "string" && c === "language-install",
			)
			if (!hasInstallLang) return

			const rawText = codeEl.children.map(extractText).join("").trim()
			const packages = rawText
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean)
				.join(" ")

			const uniqueId = `install-${++tabCounter}`

			const tabHeaders: ElementContent[] = PACKAGE_MANAGERS.map((pm, i) =>
				el(
					"label",
					{
						className: i === 0
							? ["petit-tab-label", "petit-tab-active"]
							: ["petit-tab-label"],
						"data-tab": pm.id,
					},
					[
						el(
							"input",
							{
								type: "radio",
								name: uniqueId,
								value: pm.id,
								...(i === 0 ? { checked: "" } : {}),
								className: ["sr-only"],
							},
							[],
						),
						txt(`\n      ${pm.label}\n    `),
					],
				),
			)

			const tabPanels: ElementContent[] = PACKAGE_MANAGERS.map((pm) =>
				el("div", { className: ["petit-tab-panel"], "data-tab": pm.id }, [
					el("pre", {}, [
						el("code", {}, [txt(`${pm.command} ${packages}`)]),
					]),
				]),
			)

			const wrapper: Element = el(
				"div",
				{
					className: ["petit-install-tabs"],
					"data-tabs": PACKAGE_MANAGERS.map((pm) => pm.id).join(","),
				},
				[
					el(
						"div",
						{ className: ["petit-tabs-header"] },
						tabHeaders,
					),
					...tabPanels,
				],
			)

			;(parent as Element | Root).children[index] = wrapper
		})
	}
}
