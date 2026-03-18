import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { createInterface } from "node:readline"
import { defineCommand } from "citty"

const CONFIG_TEMPLATE = `{
	"title": "My Docs",
	"sidebar": []
}
`

/** Prompt the user for a yes/no confirmation */
async function confirm(message: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout })
	return new Promise((resolve) => {
		rl.question(`${message} (y/N) `, (answer) => {
			rl.close()
			resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")
		})
	})
}

/** The `petit config` command - generates a config file */
export const configCommand = defineCommand({
	meta: {
		name: "config",
		description: "Generate a petit.config.json file",
	},
	args: {
		path: {
			type: "string",
			description: "Directory to create the config in",
			required: false,
		},
		yes: {
			type: "boolean",
			description: "Skip confirmation prompt",
			alias: "y",
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

		console.log(`[petit] This will create: ${configPath}`)
		console.log()

		if (!args.yes) {
			const ok = await confirm("[petit] Continue?")
			if (!ok) {
				console.log("[petit] Cancelled.")
				return
			}
		}

		if (!existsSync(dir)) {
			await mkdir(dir, { recursive: true })
		}

		await writeFile(configPath, CONFIG_TEMPLATE, "utf-8")
		console.log(`[petit] Created: ${configPath}`)
		console.log(`[petit] Add sidebar entries, then run \`npx @ephem-sh/petit dev\``)
	},
})
