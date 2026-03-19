import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import { defineCommand } from "citty"
import { findConfigFile } from "../config/loader"
import { getPort } from "get-port-please"
import * as log from "./logger"

const VERSION = createRequire(import.meta.url)("../../package.json").version as string

/** Resolve the bundled app directory shipped inside the package */
function resolveAppDir(): string {
	const thisFile = fileURLToPath(import.meta.url)
	return path.resolve(path.dirname(thisFile), "..", "app")
}

/** Find the vite CLI entry point via require.resolve */
function resolveViteBin(): string {
	const req = createRequire(import.meta.url)
	const vitePkg = req.resolve("vite/package.json")
	const viteDir = path.dirname(vitePkg)
	return path.join(viteDir, "bin", "vite.js")
}

/** The `petit dev` command -- starts a development server */
export const devCommand = defineCommand({
	meta: {
		name: "dev",
		description: "Start the development server",
	},
	args: {
		config: {
			type: "string",
			description: "Path to config file",
			required: false,
		},
		port: {
			type: "string",
			description: "Port to listen on",
			required: false,
		},
		profiling: {
			type: "boolean",
			description: "Show startup performance timings",
			required: false,
		},
	},
	async run({ args }) {
		const userCwd = process.cwd()

		log.banner(VERSION)

		// Find config file
		let configPath: string | undefined
		if (args.config) {
			configPath = path.resolve(args.config)
		} else {
			configPath = findConfigFile(userCwd)
		}

		if (!configPath) {
			log.error("No petit.config.json found.")
			log.info("Run 'npx @ephem-sh/petit init' to create one")
			process.exit(1)
		}

		const appDir = resolveAppDir()
		const port = await getPort({ port: args.port ? Number.parseInt(args.port, 10) : 4321 })

		log.info(`config ${path.relative(userCwd, configPath)}`)

		const viteBin = resolveViteBin()
		const viteConfig = path.join(appDir, "vite.config.ts")

		const child = spawn(process.execPath, [viteBin, "dev", "--port", String(port), "--config", viteConfig], {
			cwd: appDir,
			stdio: ["inherit", "pipe", "pipe"],
			env: {
				...process.env,
				PETIT_CONFIG_PATH: configPath,
				PETIT_USER_CWD: userCwd,
				...(args.profiling ? { PETIT_PROFILING: "1" } : {}),
			},
		})

		let docCount = 0
		let serverReady = false

		// Parse vite/plugin stdout, show our own output
		child.stdout?.on("data", (data: Buffer) => {
			const text = data.toString()
			for (const line of text.split("\n")) {
				const clean = line.replace(/\x1b\[[0-9;]*m/g, "").trim()

				// Capture doc count from plugin
				if (clean.includes("[petit] Loaded")) {
					const match = clean.match(/Loaded (\d+) document/)
					if (match) docCount = Number.parseInt(match[1], 10)
					continue
				}

				// Skip vite banner lines
				if (clean.includes("VITE v") || clean.includes("ready in") || clean.includes("Local:") || clean.includes("Network:")) {
					// Detect server ready
					if (clean.includes("Local:") && !serverReady) {
						serverReady = true
						const portMatch = clean.match(/localhost:(\d+)/)
						const actualPort = portMatch ? portMatch[1] : String(port)
						log.ready(`http://localhost:${actualPort}`, docCount)
					}
					continue
				}

				// Skip plugin internal messages (but show perf lines when profiling)
				if (clean.startsWith("[petit]") || clean.startsWith("[petit:perf]")) {
					if (args.profiling && clean.includes("[petit:perf]")) {
						const msg = clean.replace("[petit:perf] ", "")
						console.log(`  \x1b[2m|\x1b[0m \x1b[36m${msg}\x1b[0m`)
					}
					continue
				}

				// Skip empty lines and vite noise
				if (!clean) continue
				if (clean.includes("Re-optimizing dependencies")) continue
				if (clean.includes("is in use")) continue

				// Pass through everything else (HMR updates, errors, etc)
				console.log(line)
			}
		})

		// Show errors from stderr, filtering noise
		child.stderr?.on("data", (data: Buffer) => {
			const text = data.toString()
			for (const line of text.split("\n")) {
				const clean = line.replace(/\x1b\[[0-9;]*m/g, "").trim()
				// Skip deprecation warnings
				if (clean.includes("DeprecationWarning") || clean.includes("--trace-deprecation")) continue
				if (!clean) continue
				// Show real errors
				process.stderr.write(line + "\n")
			}
		})

		child.on("error", (err) => {
			log.error(`Failed to start dev server: ${err.message}`)
			process.exit(1)
		})

		child.on("exit", (code) => {
			process.exit(code ?? 0)
		})
	},
})
