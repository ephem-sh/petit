/**
 * Generate a robots.txt string.
 * If siteUrl is provided, includes a Sitemap directive.
 */
export function generateRobots(siteUrl?: string): string {
	const lines = [
		"User-agent: *",
		"Allow: /",
	]
	if (siteUrl) {
		const base = siteUrl.replace(/\/$/, "")
		lines.push("", `Sitemap: ${base}/sitemap.xml`)
	}
	return lines.join("\n") + "\n"
}
