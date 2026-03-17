import { defineConfig } from "tsup"
import { cpSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

export default defineConfig({
	entry: ["src/index.ts", "src/cli/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	target: "node20",
	async onSuccess() {
		const src = resolve("src/og/fonts")
		const dest = resolve("dist/og/fonts")
		mkdirSync(dest, { recursive: true })
		cpSync(src, dest, { recursive: true })
	},
})
