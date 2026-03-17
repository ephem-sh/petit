import type { ThemeDefinition } from "./types"
import { defaultTheme } from "./default"
import { cyberpunk2077Theme } from "./2077"
import { amberTheme } from "./amber"
import { burgundyTheme } from "./burgundy"
import { claudeTheme } from "./claude"
import { deepTheme } from "./deep"
import { ghibliTheme } from "./ghibli"
import { itadoriTheme } from "./itadori"
import { offworldTheme } from "./offworld"
import { pineTheme } from "./pine"
import { starbucksTheme } from "./starbucks"
import { stellaTheme } from "./stella"
import { supabaseTheme } from "./supabase"
import { supraTheme } from "./supra"
import { t3chatTheme } from "./t3chat"
import { vercelTheme } from "./vercel"
import { voidTheme } from "./void"
import { zenTheme } from "./zen"

/** Registry of available themes */
const themes: Record<string, ThemeDefinition> = {
	default: defaultTheme,
	"2077": cyberpunk2077Theme,
	amber: amberTheme,
	burgundy: burgundyTheme,
	claude: claudeTheme,
	deep: deepTheme,
	ghibli: ghibliTheme,
	itadori: itadoriTheme,
	offworld: offworldTheme,
	pine: pineTheme,
	starbucks: starbucksTheme,
	stella: stellaTheme,
	supabase: supabaseTheme,
	supra: supraTheme,
	t3chat: t3chatTheme,
	vercel: vercelTheme,
	void: voidTheme,
	zen: zenTheme,
}

/** Get a theme by name, falling back to default */
export function getTheme(name: string): ThemeDefinition {
	return themes[name] ?? defaultTheme
}

/** Register a custom theme */
export function registerTheme(name: string, theme: ThemeDefinition): void {
	themes[name] = theme
}

/** Get all registered theme names */
export function getThemeNames(): string[] {
	return Object.keys(themes)
}

export type { ThemeDefinition } from "./types"
export { defaultTheme } from "./default"
