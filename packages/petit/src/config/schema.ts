import { z } from "zod"

/** Schema for a single sidebar entry */
export const sidebarItemSchema = z.object({
	label: z.string(),
	path: z.string().optional(),
})

/** Schema for theme CSS variable overrides */
export const themeCustomSchema = z.record(z.string(), z.string())

/** Schema for per-scheme theme config */
export const themeSchemeSchema = z.object({
	custom: themeCustomSchema.optional(),
})

/** Schema for theme configuration */
export const themeConfigSchema = z.object({
	light: themeSchemeSchema.optional(),
	dark: themeSchemeSchema.optional(),
})

/** Zod schema that validates a PetitConfig object */
export const petitConfigSchema = z.object({
	title: z.string(),
	mediaDir: z.string().optional(),
	defaultScheme: z.enum(["dark", "light", "system"]).optional(),
	schemeSwitcher: z.boolean().optional(),
	theme: z.string().optional(),
	themeOverrides: themeConfigSchema.optional(),
	sidebar: z.array(sidebarItemSchema).optional(),
	logo: z.string().optional(),
	sidebarPosition: z.enum(["left", "right", "center"]).optional(),
	fonts: z.object({
		sans: z.string().optional(),
		mono: z.string().optional(),
	}).optional(),
	maxWidth: z.enum(["sm", "md", "lg", "xl"]).optional(),
	toc: z.boolean().optional(),
	repository: z.string().optional(),
	branch: z.string().optional(),
	siteUrl: z.string().url().optional(),
	deploy: z.enum(["node", "cloudflare", "netlify", "vercel", "bun"]).optional(),
})
