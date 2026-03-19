/** A single sidebar entry — either a category label or a doc link */
export interface SidebarItem {
	/** Display label in the sidebar */
	label: string
	/** Relative path to markdown directory (relative to config file). Categories don't have a path. */
	path?: string
}

/** Theme CSS variable overrides */
export interface ThemeCustom {
	[key: string]: string
}

/** Per-scheme theme config */
export interface ThemeScheme {
	/** CSS variable overrides for this scheme */
	custom?: ThemeCustom
}

/** Theme configuration */
export interface ThemeConfig {
	/** Light scheme overrides */
	light?: ThemeScheme
	/** Dark scheme overrides */
	dark?: ThemeScheme
}

/** Root configuration for petit */
export interface PetitConfig {
	/** Site title */
	title: string
	/** Path to media/images directory, relative to config file (default: "./docs/media") */
	mediaDir?: string
	/** Default color scheme */
	defaultScheme?: "dark" | "light" | "system"
	/** Show color scheme switcher toggle */
	schemeSwitcher?: boolean
	/** Named theme preset (e.g. "default") */
	theme?: string
	/** Theme CSS variable overrides */
	themeOverrides?: ThemeConfig
	/** Sidebar structure */
	sidebar?: SidebarItem[]
	/** Sidebar position: left (fixed), right (fixed), or center (inline before content) */
	sidebarPosition?: "left" | "right" | "center"
	/** Path to logo image, relative to config file (e.g., "./media/logo.png") */
	logo?: string
	/** Custom font overrides */
	fonts?: {
		/** Sans-serif font for body text */
		sans?: string
		/** Monospace font for code */
		mono?: string
	}
	/** Max width of the content area */
	maxWidth?: "sm" | "md" | "lg" | "xl"
	/** Show table of contents ("On this page") sidebar */
	toc?: boolean
	/** Repository URL (e.g. "https://github.com/user/repo") for "Open in GitHub" links */
	repository?: string
	/** Git branch name for "Edit on GitHub" links (default: "main") */
	branch?: string
	/** Base URL for the site (used for canonical URLs, OG images, sitemap) */
	siteUrl?: string
	/** Deploy target platform (default: "node") */
	deploy?: "node" | "cloudflare" | "netlify" | "vercel" | "bun"
	/** Show "Created with petit" credit in the sidebar (default: false) */
	credits?: boolean
}

/** Resolved config with all defaults applied */
export interface ResolvedConfig extends Required<Omit<PetitConfig, "theme" | "themeOverrides" | "sidebar" | "logo" | "maxWidth" | "sidebarPosition" | "repository" | "branch" | "siteUrl" | "fonts" | "mediaDir" | "deploy">> {
	/** Custom font overrides */
	fonts?: {
		sans?: string
		mono?: string
	}
	/** Repository URL, or undefined */
	repository?: string
	/** Git branch name */
	branch: string
	/** Base URL for the site, or undefined */
	siteUrl?: string
	/** Named theme preset */
	theme: string
	/** Max width of the content area */
	maxWidth: "sm" | "md" | "lg" | "xl"
	/** Sidebar position */
	sidebarPosition: "left" | "right" | "center"
	/** Theme CSS variable overrides */
	themeOverrides: ThemeConfig
	/** Sidebar structure */
	sidebar: SidebarItem[]
	/** Absolute path to the config file */
	configPath: string
	/** Absolute path to the documentation directory */
	docsRoot: string
	/** Absolute path to logo image, or undefined */
	logoPath?: string
	/** Absolute path to media directory */
	mediaRoot: string
	/** Deploy target platform */
	deploy: "node" | "cloudflare" | "netlify" | "vercel" | "bun"
}
