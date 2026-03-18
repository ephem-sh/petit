import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent, Properties } from "hast"

/** Install command mappings for each package manager */
const INSTALL_COMMANDS: Record<string, string> = {
	npm: "npm install",
	pnpm: "pnpm add",
	bun: "bun add",
	yarn: "yarn add",
}

/** Runner command mappings for live/exec mode */
const RUNNER_COMMANDS: Record<string, string> = {
	npm: "npx",
	pnpm: "pnpm dlx",
	bun: "bun x",
	yarn: "yarn dlx",
}

/** Default package managers shown when none are specified */
const DEFAULT_MANAGERS = ["npm", "pnpm", "bun", "yarn"]

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

/** Detected command block type */
type CommandType =
	| { kind: "install"; packages: string }
	| { kind: "command"; managers: string[]; content: string; live: boolean }

/** Detect whether a code element is an install or command block */
function detectCommand(codeEl: Element): CommandType | undefined {
	const className = codeEl.properties?.className
	if (!Array.isArray(className)) return undefined

	const classes = className.filter((c): c is string => typeof c === "string")

	if (classes.includes("language-install")) {
		const rawText = codeEl.children.map(extractText).join("").trim()
		const packages = rawText.split("\n").map((l) => l.trim()).filter(Boolean).join(" ")
		return { kind: "install", packages }
	}

	const commandClass = classes.find((c) => c.startsWith("language-command"))
	if (!commandClass) return undefined

	const rawText = codeEl.children.map(extractText).join("").trim()

	const meta =
		(codeEl.data as Record<string, unknown> | undefined)?.meta as string | undefined ??
		(codeEl.properties?.metastring as string | undefined) ??
		(codeEl.properties?.dataMeta as string | undefined) ??
		""

	const tokens = meta.trim().split(/\s+/).filter(Boolean)
	const live = tokens.includes("live")
	const managersFromMeta = tokens.filter((t) => t !== "live")

	const managers = managersFromMeta.length > 0 ? managersFromMeta : DEFAULT_MANAGERS

	return { kind: "command", managers, content: rawText, live }
}

/** Build tab entries from a detected command type */
function buildTabs(cmd: CommandType): Array<{ id: string; label: string; command: string }> {
	if (cmd.kind === "install") {
		return DEFAULT_MANAGERS.map((id) => ({
			id,
			label: id,
			command: `${INSTALL_COMMANDS[id]} ${cmd.packages}`,
		}))
	}

	if (cmd.live) {
		return cmd.managers.map((id) => ({
			id,
			label: id,
			command: `${RUNNER_COMMANDS[id] ?? id} ${cmd.content}`,
		}))
	}

	return cmd.managers.map((id) => ({
		id,
		label: id,
		command: `${id} ${cmd.content}`,
	}))
}

/**
 * Rehype plugin that transforms code blocks with language `install` or `command`
 * into tabbed command panels for multiple package managers.
 *
 * Supports two syntaxes:
 * - `install`: content is package name(s), auto-generates install commands
 * - `command [managers...]`: content is the raw command, prefixed with each manager
 */
export function rehypeCommand() {
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

			const cmd = detectCommand(codeEl)
			if (!cmd) return

			const tabs = buildTabs(cmd)
			const uniqueId = `install-${++tabCounter}`

			const tabHeaders: ElementContent[] = tabs.map((tab, i) =>
				el(
					"label",
					{
						className: i === 0
							? ["petit-tab-label", "petit-tab-active"]
							: ["petit-tab-label"],
						"data-tab": tab.id,
					},
					[
						el(
							"input",
							{
								type: "radio",
								name: uniqueId,
								value: tab.id,
								...(i === 0 ? { checked: "" } : {}),
								className: ["sr-only"],
							},
							[],
						),
						txt(tab.label),
					],
				),
			)

			const tabPanels: ElementContent[] = tabs.map((tab) =>
				el("div", { className: ["petit-tab-panel"], "data-tab": tab.id }, [
					el("pre", {}, [
						el("code", {}, [txt(tab.command)]),
					]),
				]),
			)

			const wrapper: Element = el(
				"div",
				{
					className: ["petit-install-tabs"],
					"data-tabs": tabs.map((t) => t.id).join(","),
				},
				[
					el("div", { className: ["petit-tabs-header"] }, tabHeaders),
					...tabPanels,
				],
			)

			;(parent as Element | Root).children.splice(index, 1, wrapper)
		})
	}
}
