export type {
	SidebarItem,
	ThemeCustom,
	ThemeScheme,
	ThemeConfig,
	PetitConfig,
	ResolvedConfig,
} from "./types"
export {
	sidebarItemSchema,
	themeCustomSchema,
	themeSchemeSchema,
	themeConfigSchema,
	petitConfigSchema,
} from "./schema"
export { loadConfig } from "./loader"
