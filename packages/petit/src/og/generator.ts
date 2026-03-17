import { readFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createOgTemplate } from "./template"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Find the fonts directory by checking known locations relative to the compiled output. */
function findFontsDir(): string {
	const candidates = [
		resolve(__dirname, "fonts"),
		resolve(__dirname, "..", "og", "fonts"),
		resolve(__dirname, "og", "fonts"),
	]
	for (const candidate of candidates) {
		if (existsSync(resolve(candidate, "Inter-Regular.ttf"))) {
			return candidate
		}
	}
	throw new Error(
		`[petit] Could not find OG font files. Searched:\n${candidates.join("\n")}`,
	)
}

/**
 * Generate a PNG buffer for an OG image using satori and @resvg/resvg-js.
 * Dynamically imports satori and resvg to keep them as optional deps.
 */
export async function generateOgImage(options: {
	title: string
	description?: string
	siteName: string
	bgColor: string
	fgColor: string
	mutedColor: string
}): Promise<Buffer> {
	const satori = (await import("satori")).default
	const { Resvg } = await import("@resvg/resvg-js")

	const fontsDir = findFontsDir()
	const interRegular = readFileSync(resolve(fontsDir, "Inter-Regular.ttf"))
	const interBold = readFileSync(resolve(fontsDir, "Inter-Bold.ttf"))

	const element = createOgTemplate(options)

	const svg = await satori(element as React.ReactNode, {
		width: 1200,
		height: 630,
		fonts: [
			{
				name: "Inter",
				data: interRegular,
				weight: 400,
				style: "normal",
			},
			{
				name: "Inter",
				data: interBold,
				weight: 700,
				style: "normal",
			},
		],
	})

	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: 1200 },
	})

	return Buffer.from(resvg.render().asPng())
}
