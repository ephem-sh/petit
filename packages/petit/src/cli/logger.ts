import path from "node:path"
import { DocumentParseError } from "../markdown/parse"

const RESET = "\x1b[0m"
const BOLD = "\x1b[1m"
const DIM = "\x1b[2m"
const CYAN = "\x1b[36m"
const GREEN = "\x1b[32m"
const YELLOW = "\x1b[33m"
const RED = "\x1b[31m"
const MAGENTA = "\x1b[35m"

const PETIT = `${BOLD}${MAGENTA}petit${RESET}`

/** Print the startup banner */
export function banner(version: string): void {
	console.log()
	console.log(`  ${PETIT} ${DIM}v${version}${RESET}`)
}

/** Log an info message */
export function info(msg: string): void {
	console.log(`  ${DIM}|${RESET} ${msg}`)
}

/** Log a success message */
export function success(msg: string): void {
	console.log(`  ${GREEN}+${RESET} ${msg}`)
}

/** Log a warning */
export function warn(msg: string): void {
	console.log(`  ${YELLOW}!${RESET} ${msg}`)
}

/** Log an error */
export function error(msg: string): void {
	console.error(`  ${RED}x${RESET} ${msg}`)
}

/** Print the dev server ready message */
export function ready(url: string, docCount: number): void {
	console.log()
	console.log(`  ${GREEN}${BOLD}ready${RESET} ${DIM}at${RESET} ${CYAN}${url}${RESET}`)
	console.log(`  ${DIM}${docCount} document${docCount !== 1 ? "s" : ""} loaded${RESET}`)
	console.log()
}

/** Print build complete summary */
export function buildDone(outputDir: string, duration: string): void {
	console.log()
	console.log(`  ${GREEN}${BOLD}built${RESET} ${DIM}in${RESET} ${duration}`)
	console.log(`  ${DIM}output${RESET} ${outputDir}`)
	console.log()
}

/** Log an indented, dimmed detail line beneath an info heading */
export function detail(msg: string): void {
	console.log(`  ${DIM}|   ${msg}${RESET}`)
}

/** Log a dimmed label followed by a highlighted URL */
export function link(label: string, url: string): void {
	console.log(`  ${DIM}|${RESET} ${DIM}${label}${RESET} ${CYAN}${url}${RESET}`)
}

/**
 * Print a document that failed to parse: `path:line:col reason`, then two
 * lines of context around the error with a caret at the column. Any other
 * error prints its message and stack once.
 */
export function documentError(err: unknown, cwd: string = process.cwd()): void {
	if (!(err instanceof DocumentParseError)) {
		const text = err instanceof Error ? (err.stack ?? err.message) : String(err)
		error(text)
		return
	}
	const rel = path.relative(cwd, err.filePath) || err.filePath
	const at = err.line === undefined ? rel : `${rel}:${err.line}:${err.column ?? 1}`
	const rule = err.ruleId ? ` ${DIM}(${err.source ? `${err.source}:` : ""}${err.ruleId})${RESET}` : ""
	console.error(`  ${RED}x${RESET} ${BOLD}${at}${RESET} ${err.reason}${rule}`)
	if (err.line === undefined) return

	const lines = err.fileSource.split(/\r?\n/)
	const first = Math.max(1, err.line - 2)
	const last = Math.min(lines.length, err.line + 2)
	const width = String(last).length
	for (let n = first; n <= last; n++) {
		const marker = n === err.line ? `${RED}>${RESET}` : " "
		console.error(`    ${marker} ${DIM}${String(n).padStart(width)} |${RESET} ${lines[n - 1] ?? ""}`)
		if (n === err.line) {
			const pad = " ".repeat(Math.max(0, (err.column ?? 1) - 1))
			console.error(`      ${" ".repeat(width)} ${DIM}|${RESET} ${pad}${RED}^${RESET}`)
		}
	}
}

/** Print a horizontal line */
export function line(): void {
	console.log()
}
