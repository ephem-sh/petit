import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import netlify from "@netlify/vite-plugin-tanstack-start"
import { petitPlugin } from "@ephem-sh/petit/plugin"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [
		petitPlugin({
			userCwd: process.env.PETIT_USER_CWD,
		}),
		netlify(),
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
