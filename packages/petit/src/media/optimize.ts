import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"]
const SIZES = [640, 1024, 1920]

/**
 * Optimize images in the media directory.
 * Converts to WebP and generates responsive sizes.
 * Writes optimized images to the output directory.
 */
export async function optimizeImages(mediaRoot: string, outDir: string): Promise<void> {
	if (!existsSync(mediaRoot)) return

	const mediaOut = path.join(outDir, "media")
	if (!existsSync(mediaOut)) mkdirSync(mediaOut, { recursive: true })

	// Copy all media files as-is (originals needed for logos, favicons, etc.)
	for (const file of readdirSync(mediaRoot)) {
		const srcPath = path.join(mediaRoot, file)
		const destPath = path.join(mediaOut, file)
		cpSync(srcPath, destPath)
	}

	let sharp: typeof import("sharp")
	try {
		sharp = (await import("sharp")).default
	} catch {
		console.warn("[petit] sharp not available, skipping image optimization")
		return
	}

	const files = readdirSync(mediaRoot)

	for (const file of files) {
		const ext = path.extname(file).toLowerCase()
		if (!IMAGE_EXTENSIONS.includes(ext)) continue

		const inputPath = path.join(mediaRoot, file)
		const baseName = path.basename(file, ext)

		try {
			const image = sharp(inputPath)
			const metadata = await image.metadata()
			const width = metadata.width ?? 1920

			const webpBuffer = await image.webp({ quality: 80 }).toBuffer()
			writeFileSync(path.join(mediaOut, `${baseName}.webp`), webpBuffer)

			for (const size of SIZES) {
				if (width <= size) continue
				const resized = await sharp(inputPath)
					.resize(size)
					.webp({ quality: 80 })
					.toBuffer()
				writeFileSync(path.join(mediaOut, `${baseName}-${size}w.webp`), resized)
			}

			console.log(`[petit] Optimized: ${file}`)
		} catch (err) {
			console.warn(`[petit] Failed to optimize ${file}:`, err instanceof Error ? err.message : String(err))
		}
	}
}
