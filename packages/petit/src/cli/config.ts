import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { defineCommand } from "citty"

const CONFIG_TEMPLATE = `{
	"title": "My Docs",
	"sidebar": []
}
`

/** The `petit config` command - generates a config file */
export const configCommand = defineCommand({
	meta: {
		name: "config",
		description: "Generate a petit.config.json in the current directory",
	},
	args: {
		path: {
			type: "string",
			description: "Directory to create the config in",
			required: false,
		},
	},
	async run({ args }) {
		const dir = resolve(args.path || process.cwd())
		const configPath = join(dir, "petit.config.json")

		if (existsSync(configPath)) {
			console.log(`[petit] Config already exists: ${configPath}`)
			return
		}

		if (!existsSync(dir)) {
			await mkdir(dir, { recursive: true })
		}

		await writeFile(configPath, CONFIG_TEMPLATE, "utf-8")
		console.log(`[petit] Created: ${configPath}`)
		console.log(`[petit] Add your sidebar entries, then run \`npx @ephem-sh/petit dev\``)
	},
})
