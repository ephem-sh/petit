import { existsSync, writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { defineCommand } from "citty"
import { loadConfig } from "../config/loader"
import { scanSidebar } from "../sidebar/scanner"
import { getTheme } from "../themes"
import { generateThemeCSS, generateProseCSS } from "../themes/generate-css"
import { parseDocument } from "../markdown/parse"

/** The `petit export` command - exports docs as a single printable HTML file */
export const exportCommand = defineCommand({
	meta: {
		name: "export",
		description: "Export documentation as a single printable HTML file",
	},
	args: {
		config: {
			type: "string",
			description: "Path to config file",
			required: false,
		},
		output: {
			type: "string",
			description: "Output file path",
			required: false,
		},
	},
	async run({ args }) {
		const config = await loadConfig(args.config || undefined)
		const sidebar = await scanSidebar(config)
		const theme = getTheme(config.theme)

		const sections: string[] = []

		for (const category of sidebar) {
			sections.push(
				`<h1 style="page-break-before:always;margin-top:2rem;">${category.label}</h1>`,
			)
			for (const entry of category.entries) {
				if (entry.draft) continue
				const slugDir = entry.slug.includes("/") ? entry.slug.slice(0, entry.slug.lastIndexOf("/")) : ""
				const parsed = await parseDocument(entry.filePath, {
					shikiThemes: { light: theme.shiki.light, dark: theme.shiki.dark },
					slugDir,
				})
				sections.push(`<article class="prose">${parsed.html}</article>`)
			}
		}

		const css = generateThemeCSS(theme) + "\n" + generateProseCSS(theme)
		const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(config.title)}</title>
<style>
${css}
body { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; }
article { margin-bottom: 2rem; }
pre { white-space: pre-wrap; word-wrap: break-word; }
@media print {
  body { max-width: 100%; padding: 0; }
  h1 { page-break-before: always; }
  pre, blockquote, table { page-break-inside: avoid; }
}
</style>
</head>
<body class="dark">
<h1>${escapeHtml(config.title)}</h1>
${sections.join("\n")}
</body>
</html>`

		const outputPath = args.output || "docs-export.html"
		const outputDir = path.dirname(outputPath)
		if (outputDir && !existsSync(outputDir))
			mkdirSync(outputDir, { recursive: true })
		writeFileSync(outputPath, html, "utf-8")
		console.log(`[petit] Exported to ${outputPath}`)
		console.log(`[petit] Open in a browser and use Print > Save as PDF`)
	},
})

/** Escape HTML special characters to prevent injection in generated output */
function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}
