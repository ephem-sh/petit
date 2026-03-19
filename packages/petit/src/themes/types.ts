import type { themeNames } from "@shikijs/themes"

/** Shiki theme name from the bundled themes */
type BundledTheme = (typeof themeNames)[number]

/** Font configuration for a theme */
export interface ThemeFonts {
	/** Sans-serif font stack for body text */
	sans: string
	/** Monospace font stack for code */
	mono: string
}

/** CSS variable values for a color scheme */
export interface ThemeColors {
	background: string
	foreground: string
	card: string
	"card-foreground": string
	popover: string
	"popover-foreground": string
	primary: string
	"primary-foreground": string
	secondary: string
	"secondary-foreground": string
	muted: string
	"muted-foreground": string
	accent: string
	"accent-foreground": string
	destructive: string
	border: string
	input: string
	ring: string
	radius: string
	sidebar: string
	"sidebar-foreground": string
	"sidebar-primary": string
	"sidebar-primary-foreground": string
	"sidebar-accent": string
	"sidebar-accent-foreground": string
	"sidebar-border": string
	"sidebar-ring": string
}

/** Prose/typography overrides */
export interface ThemeProse {
	/** Heading sizes: h1, h2, h3, h4 */
	headings: {
		h1: string
		h2: string
		h3: string
		h4: string
	}
	/** Base body text size */
	body: string
	/** Line height for body text */
	lineHeight: string
	/** Code block border radius */
	codeRadius: string
}

/** Complete theme definition */
export interface ThemeDefinition {
	/** Theme display name */
	name: string
	/** Light scheme colors */
	light: ThemeColors
	/** Dark scheme colors */
	dark: ThemeColors
	/** Font configuration */
	fonts: ThemeFonts
	/** Shiki themes for code highlighting */
	shiki: {
		light: BundledTheme
		dark: BundledTheme
	}
	/** Typography/prose settings */
	prose: ThemeProse
}
