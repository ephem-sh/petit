import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkFrontmatter from "remark-frontmatter"
import remarkMdx from "remark-mdx"
import remarkRehype from "remark-rehype"
import rehypeSlug from "rehype-slug"
import rehypeStringify from "rehype-stringify"
import { createHighlighterCore, type HighlighterCore } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import { visit } from "unist-util-visit"
import type { Root, Element, ElementContent } from "hast"
import type { DocumentHeading } from "./types"
import { rehypeMermaid } from "./plugins/rehype-mermaid"
import { rehypeCommand } from "./plugins/rehype-command"
import { rehypeCards } from "./plugins/rehype-cards"
import { rehypeTypeTable } from "./plugins/rehype-type-table"
import { rehypeAccordion } from "./plugins/rehype-accordion"
import { rehypeTabs } from "./plugins/rehype-tabs"
import { rehypeSteps } from "./plugins/rehype-steps"
import { rehypeCodeblock } from "./plugins/rehype-codeblock"
import { rehypeCodeMeta } from "./plugins/rehype-code-meta"
import { rehypeTables } from "./plugins/rehype-tables"
import rehypeKatex from "rehype-katex"
import { rehypeImages } from "./plugins/rehype-images"
import { rehypeCallouts } from "./plugins/rehype-callouts"
import { rehypeVideo } from "./plugins/rehype-video"
import { rehypeThemePreview } from "./plugins/rehype-theme-preview"

const DEFAULT_SHIKI_THEME = "github-dark-default"

let currentShikiThemes: { light: string; dark: string } = { light: "github-light-default", dark: DEFAULT_SHIKI_THEME }
let highlighterPromise: Promise<HighlighterCore> | undefined

/** Get or create a singleton shiki highlighter for the current themes */
function getHighlighter(): Promise<HighlighterCore> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighterCore({
			themes: [
				import(`@shikijs/themes/${currentShikiThemes.light}`),
				import(`@shikijs/themes/${currentShikiThemes.dark}`),
			],
			langs: [],
			engine: createJavaScriptRegexEngine({ forgiving: true }),
		})
	}
	return highlighterPromise
}

/** Extract plain text content from a hast element */
function textContent(node: Element | ElementContent): string {
	if (node.type === "text") return node.value
	if (node.type === "element") return node.children.map(textContent).join("")
	return ""
}

/** Rehype plugin that highlights code blocks using shiki */
function rehypeShikiPlugin() {
	return async (tree: Root): Promise<void> => {
		const highlighter = await getHighlighter()
		const nodesToProcess: { node: Element; lang: string; code: string; parent: Root | Element; index: number }[] = []

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

			const langClass = className.find(
				(c): c is string => typeof c === "string" && c.startsWith("language-"),
			)
			if (!langClass) return

			const lang = langClass.replace("language-", "")
			const code = textContent(codeEl)

			nodesToProcess.push({
				node,
				lang,
				code,
				parent: parent as Root | Element,
				index,
			})
		})

		for (const { node, lang, code, parent, index } of nodesToProcess) {
			const loadedLangs = highlighter.getLoadedLanguages()
			let resolvedLang = lang
			if (!loadedLangs.includes(lang)) {
				try {
					await highlighter.loadLanguage(import(`@shikijs/langs/${lang}`))
				} catch {
					// Unknown language: fall back to markdown highlighting
					resolvedLang = "markdown"
					if (!loadedLangs.includes("markdown")) {
						try {
							await highlighter.loadLanguage(import("@shikijs/langs/markdown"))
						} catch {
							continue
						}
					}
				}
			}

			const hast = highlighter.codeToHast(code, {
				lang: resolvedLang,
				themes: {
					light: currentShikiThemes.light,
					dark: currentShikiThemes.dark,
				},
				defaultColor: "dark",
			})

			const preNode = hast.children[0]
			if (preNode && preNode.type === "element") {
				// Preserve data-meta from the original node (set by rehypeCodeMeta)
				const meta = node.properties?.dataMeta
				if (meta) {
					preNode.properties = preNode.properties ?? {}
					preNode.properties.dataMeta = meta
				}
				parent.children[index] = preNode
			}
		}
	}
}

/** Rehype plugin that collects headings into vfile data */
function rehypeCollectHeadings() {
	return (tree: Root, file: { data: Record<string, unknown> }): void => {
		const headings: DocumentHeading[] = []

		visit(tree, "element", (node: Element) => {
			const match = /^h([1-6])$/.exec(node.tagName)
			if (!match) return

			const depth = Number(match[1])
			const id = typeof node.properties?.id === "string" ? node.properties.id : ""
			const text = textContent(node)

			headings.push({ depth, text, id })
		})

		file.data.headings = headings
	}
}

/** Options for configuring the markdown processor */
export interface ProcessorOptions {
	/** Shiki theme names for light and dark code highlighting */
	shikiThemes?: { light: string; dark: string }
}

type MarkdownProcessor = ReturnType<typeof unified>

const processorCache = new Map<string, MarkdownProcessor>()

/** Create (or return cached) unified processor for markdown/mdx rendering */
export function createProcessor(options?: ProcessorOptions): MarkdownProcessor {
	const themes = options?.shikiThemes ?? { light: "github-light-default", dark: DEFAULT_SHIKI_THEME }
	const cacheKey = `${themes.light}:${themes.dark}`
	const cached = processorCache.get(cacheKey)
	if (cached) return cached

	currentShikiThemes = themes
	highlighterPromise = undefined

	const processor = unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkMath)
			.use(remarkFrontmatter)
			.use(remarkMdx)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeKatex)
			.use(rehypeCallouts)
			.use(rehypeMermaid)
			.use(rehypeVideo)
			.use(rehypeThemePreview)
			.use(rehypeCommand)
			.use(rehypeCards)
			.use(rehypeTypeTable)
			.use(rehypeAccordion)
			.use(rehypeTabs)
			.use(rehypeSteps)
			.use(rehypeCodeMeta)
			.use(rehypeSlug)
			.use(rehypeShikiPlugin)
			.use(rehypeCodeblock)
			.use(rehypeTables)
			.use(rehypeImages)
			.use(rehypeCollectHeadings)
			.use(rehypeStringify, { allowDangerousHtml: true }) as unknown as MarkdownProcessor

	processorCache.set(cacheKey, processor)
	return processor
}
