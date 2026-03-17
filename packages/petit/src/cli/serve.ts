import { defineCommand } from "citty"

/** The `petit serve` command — serves the built documentation */
export const serveCommand = defineCommand({
	meta: {
		name: "serve",
		description: "Serve the built documentation site",
	},
	args: {
		config: {
			type: "string",
			description: "Path to config file",
			required: false,
		},
	},
	run() {
		console.log("[petit] Serving from dist/ — not yet implemented")
	},
})
