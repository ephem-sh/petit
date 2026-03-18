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

/** Print a horizontal line */
export function line(): void {
	console.log()
}
