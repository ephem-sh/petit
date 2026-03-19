/// <reference types="vite/client" />

declare module "virtual:petit/config" {
	export const config: {
		title: string
		defaultScheme: "dark" | "light" | "system"
		schemeSwitcher: boolean
		theme: string
		themeOverrides: Record<string, unknown>
		logo: string | null
		logoDark: string | null
		maxWidth: "sm" | "md" | "lg" | "xl"
		sidebarPosition: "left" | "right" | "center"
		toc: boolean
		repository: string | null
		branch: string
		siteUrl: string | null
		favicon: string | null
		shiki: { light: string; dark: string }
	}
}

declare module "virtual:petit/sidebar" {
	export interface SidebarCategory {
		label: string
		depth: number
		entries: Array<{ label: string; slug: string; draft: boolean }>
		children?: SidebarCategory[]
	}
	export const sidebar: SidebarCategory[]
}

declare module "virtual:petit/docs" {
	export const docs: Record<
		string,
		{
			html: string
			raw: string
			filePath: string
			frontmatter: {
				title?: string
				description?: string
				order?: number
				draft?: boolean
			}
			headings: Array<{ depth: number; text: string; id: string }>
			lastModified: string
		}
	>
}

declare module "virtual:petit/error" {
	export const configError: string | null
}

declare module "virtual:petit/search" {
	export const searchIndex: unknown
}

declare module "virtual:petit/themes" {
	export const themes: Record<
		string,
		{ light: Record<string, string>; dark: Record<string, string> }
	>
}

declare module "virtual:petit/theme.css" {}
