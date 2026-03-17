import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import type { ParsedDocument } from "../markdown/types"

const CACHE_DIR = "node_modules/.petit-cache"
const CACHE_FILE = "parsed-docs.json"

/** A single cached document entry with its content hash */
interface CacheEntry {
	hash: string
	parsed: ParsedDocument
}

/** Full cache structure keyed by file path, namespaced by theme */
interface CacheData {
	theme: string
	entries: Record<string, CacheEntry>
}

/** Compute an MD5 content hash for cache invalidation */
export function fileHash(content: string): string {
	return createHash("md5").update(content).digest("hex")
}

/** Load the parsed document cache from disk. Returns empty if missing or corrupt. */
export function loadCache(theme: string): Record<string, CacheEntry> {
	const cachePath = join(CACHE_DIR, CACHE_FILE)
	if (!existsSync(cachePath)) return {}
	try {
		const data = JSON.parse(readFileSync(cachePath, "utf-8")) as CacheData
		if (data.theme !== theme) return {}
		return data.entries
	} catch {
		return {}
	}
}

/** Persist the parsed document cache to disk */
export function saveCache(entries: Record<string, CacheEntry>, theme: string): void {
	if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
	const data: CacheData = { theme, entries }
	writeFileSync(join(CACHE_DIR, CACHE_FILE), JSON.stringify(data), "utf-8")
}

/** Check if a file's content matches the cached version */
export function isCached(cache: Record<string, CacheEntry>, filePath: string, content: string): boolean {
	const entry = cache[filePath]
	if (!entry) return false
	return entry.hash === fileHash(content)
}

/** Get a cached parsed document by file path */
export function getCached(cache: Record<string, CacheEntry>, filePath: string): ParsedDocument | undefined {
	return cache[filePath]?.parsed
}

/** Update a cache entry with new content hash and parsed document */
export function setCached(
	cache: Record<string, CacheEntry>,
	filePath: string,
	content: string,
	parsed: ParsedDocument,
): void {
	cache[filePath] = { hash: fileHash(content), parsed }
}
