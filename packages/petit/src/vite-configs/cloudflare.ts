import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { cloudflare } from "@cloudflare/vite-plugin"
import { petitPlugin } from "@ephem-sh/petit/plugin"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		petitPlugin({
			userCwd: process.env.PETIT_USER_CWD,
		}),
		tailwindcss(),
		tanstackStart({ srcDirectory: "." }),
		viteReact(),
	],
	resolve: {
		alias: {
			"~": __dirname,
		},
	},
})
