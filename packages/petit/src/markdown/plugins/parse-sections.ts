/** A parsed section from a code fence with `# heading` delimiters */
export interface Section {
	title: string
	content: string
}

/** Parse code fence content into sections split by `# ` headings */
export function parseSections(text: string): Section[] {
	const sections: Section[] = []
	const lines = text.replace(/\r/g, "").trim().split("\n")
	let currentTitle = ""
	let currentLines: string[] = []

	for (const line of lines) {
		if (line.startsWith("# ")) {
			if (currentTitle) {
				sections.push({ title: currentTitle, content: currentLines.join("\n").trim() })
			}
			currentTitle = line.slice(2).trim()
			currentLines = []
		} else {
			currentLines.push(line)
		}
	}
	if (currentTitle) {
		sections.push({ title: currentTitle, content: currentLines.join("\n").trim() })
	}
	return sections
}

/** Apply simple inline markdown transforms: backtick code, bold, and links */
export function inlineMarkdown(text: string): string {
	return text
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

/** Inline markdown token types */
interface InlineToken {
	type: "text" | "code" | "strong" | "link"
	value: string
	href?: string
}

/** Tokenize inline markdown into structured tokens */
function tokenizeInline(text: string): InlineToken[] {
	const tokens: InlineToken[] = []
	const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
	let lastIndex = 0
	let match: RegExpExecArray | null

	while ((match = pattern.exec(text)) !== null) {
		if (match.index > lastIndex) {
			tokens.push({ type: "text", value: text.slice(lastIndex, match.index) })
		}
		if (match[1] !== undefined) {
			tokens.push({ type: "code", value: match[1] })
		} else if (match[2] !== undefined) {
			tokens.push({ type: "strong", value: match[2] })
		} else if (match[3] !== undefined && match[4] !== undefined) {
			tokens.push({ type: "link", value: match[3], href: match[4] })
		}
		lastIndex = match.index + match[0].length
	}

	if (lastIndex < text.length) {
		tokens.push({ type: "text", value: text.slice(lastIndex) })
	}

	return tokens
}

/** Convert inline markdown to hast-compatible ElementContent nodes */
export function inlineMarkdownHast(text: string): import("hast").ElementContent[] {
	const tokens = tokenizeInline(text)
	return tokens.map((token): import("hast").ElementContent => {
		switch (token.type) {
			case "text":
				return { type: "text", value: token.value }
			case "code":
				return {
					type: "element",
					tagName: "code",
					properties: {},
					children: [{ type: "text", value: token.value }],
				}
			case "strong":
				return {
					type: "element",
					tagName: "strong",
					properties: {},
					children: [{ type: "text", value: token.value }],
				}
			case "link":
				return {
					type: "element",
					tagName: "a",
					properties: { href: token.href ?? "" },
					children: [{ type: "text", value: token.value }],
				}
		}
	})
}
