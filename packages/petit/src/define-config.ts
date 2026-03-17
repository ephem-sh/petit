import type { PetitConfig } from "./config/types"

/**
 * Define a Petit configuration with full type safety.
 *
 * Use this in your `petit.config.ts` to get autocompletion and validation.
 *
 * @param config - The Petit configuration object
 * @returns The same configuration object, unchanged
 */
export function defineConfig(config: PetitConfig): PetitConfig {
	return config
}
