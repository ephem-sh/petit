import { existsSync, mkdirSync, writeFileSync, cpSync, rmSync, readFileSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import type { ResolvedConfig } from "../config/types"
import * as log from "./logger"

const require = createRequire(import.meta.url)
const petitPkg = require("../../package.json") as { version: string; dependencies: Record<string, string> }

/** Scaffold a `.petit/` build workspace by copying the bundled app template, config, docs, and media, then installing dependencies. */
export async function scaffoldPetitApp(opts: {
	userCwd: string
	config: ResolvedConfig
}): Promise<string> {
	const petitDir = path.join(opts.userCwd, ".petit")
	const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
	const appTemplate = path.join(distDir, "app")
	const viteConfigsDir = path.join(distDir, "vite-configs")
	const platformsDir = path.join(distDir, "platforms")

	if (existsSync(petitDir)) rmSync(petitDir, { recursive: true, force: true })
	mkdirSync(petitDir, { recursive: true })

	cpSync(appTemplate, petitDir, {
		recursive: true,
		filter: (src) => {
			const basename = path.basename(src)
			return !["node_modules", ".wrangler", ".nitro", ".output", "vite.config.ts", ".vinxi"].includes(basename)
		},
	})

	const viteConfigSrc = path.join(viteConfigsDir, `${opts.config.deploy}.ts`)
	if (existsSync(viteConfigSrc)) {
		cpSync(viteConfigSrc, path.join(petitDir, "vite.config.ts"))
	} else {
		cpSync(path.join(viteConfigsDir, "node.ts"), path.join(petitDir, "vite.config.ts"))
	}

	if (opts.config.deploy === "cloudflare") {
		const wranglerSrc = path.join(platformsDir, "cloudflare", "wrangler.jsonc")
		if (existsSync(wranglerSrc)) {
			let content = readFileSync(wranglerSrc, "utf-8")
			const slug = opts.config.title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
			content = content.replace("{{name}}", slug)
			writeFileSync(path.join(petitDir, "wrangler.jsonc"), content, "utf-8")
		}
	}

	cpSync(opts.config.configPath, path.join(petitDir, "petit.config.json"))

	for (const item of opts.config.sidebar) {
		if (!item.path) continue
		const srcDir = path.resolve(path.dirname(opts.config.configPath), item.path)
		if (!existsSync(srcDir)) continue
		const relPath = item.path.startsWith("./") ? item.path.slice(2) : item.path
		const destDir = path.join(petitDir, relPath)
		mkdirSync(path.dirname(destDir), { recursive: true })
		cpSync(srcDir, destDir, { recursive: true })
	}

	if (existsSync(opts.config.mediaRoot)) {
		const configDir = path.dirname(opts.config.configPath)
		const relMedia = path.relative(configDir, opts.config.mediaRoot)
		const destMedia = path.join(petitDir, relMedia)
		mkdirSync(path.dirname(destMedia), { recursive: true })
		cpSync(opts.config.mediaRoot, destMedia, { recursive: true })
	}

	const fromDep = (name: string): string => petitPkg.dependencies[name] ?? "latest"

	const deps: Record<string, string> = {
		"@ephem-sh/petit": `^${petitPkg.version}`,
		"@tanstack/react-start": fromDep("@tanstack/react-start"),
		"@tanstack/react-router": fromDep("@tanstack/react-router"),
		"@tanstack/router-plugin": fromDep("@tanstack/router-plugin"),
		"@vitejs/plugin-react": fromDep("@vitejs/plugin-react"),
		"vite": fromDep("vite"),
		"react": fromDep("react"),
		"react-dom": fromDep("react-dom"),
		"tailwindcss": fromDep("tailwindcss"),
		"@tailwindcss/vite": fromDep("@tailwindcss/vite"),
		"@tailwindcss/typography": fromDep("@tailwindcss/typography"),
		"radix-ui": fromDep("radix-ui"),
		"shadcn": fromDep("shadcn"),
		"class-variance-authority": fromDep("class-variance-authority"),
		"clsx": fromDep("clsx"),
		"cmdk": fromDep("cmdk"),
		"tailwind-merge": fromDep("tailwind-merge"),
		"tw-animate-css": fromDep("tw-animate-css"),
		"motion": fromDep("motion"),
		"mermaid": fromDep("mermaid"),
		"@phosphor-icons/react": fromDep("@phosphor-icons/react"),
		"simple-icons": fromDep("simple-icons"),
		"@orama/orama": fromDep("@orama/orama"),
		"@fontsource/google-sans": fromDep("@fontsource/google-sans"),
		"@fontsource-variable/jetbrains-mono": fromDep("@fontsource-variable/jetbrains-mono"),
	}

	switch (opts.config.deploy) {
		case "cloudflare":
			deps["@cloudflare/vite-plugin"] = "latest"
			deps["wrangler"] = "latest"
			break
		case "netlify":
			deps["@netlify/vite-plugin-tanstack-start"] = "latest"
			break
		case "node":
		case "vercel":
		case "bun":
		default:
			deps["nitro"] = fromDep("nitro")
			break
	}

	const pkgJson = {
		private: true,
		type: "module" as const,
		scripts: { build: "vite build" },
		dependencies: deps,
	}
	writeFileSync(path.join(petitDir, "package.json"), JSON.stringify(pkgJson, null, "\t"), "utf-8")

	const pm = detectPackageManager(opts.userCwd)
	log.info(`installing dependencies (${pm})...`)
	await runInstall(petitDir, pm)
	log.success("dependencies installed")

	return petitDir
}

function detectPackageManager(cwd: string): "bun" | "pnpm" | "npm" {
	if (existsSync(path.join(cwd, "bun.lockb")) || existsSync(path.join(cwd, "bun.lock"))) return "bun"
	if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm"
	return "npm"
}

function runInstall(dir: string, pm: string): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(pm, ["install"], {
			cwd: dir,
			stdio: ["inherit", "pipe", "pipe"],
			shell: true,
			env: {
				...process.env,
				NODE_NO_WARNINGS: "1",
			},
		})
		let stderr = ""
		child.stdout?.on("data", () => {})
		child.stderr?.on("data", (data: Buffer) => { stderr += data.toString() })
		child.on("error", reject)
		child.on("exit", (code) => {
			if (code === 0) resolve()
			else reject(new Error(`${pm} install failed (exit ${code}): ${stderr}`))
		})
	})
}
