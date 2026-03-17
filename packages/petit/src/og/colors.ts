/**
 * Convert an oklch() CSS color string to a hex color.
 * Handles formats: oklch(L C H), oklch(L C H / A), oklch(L 0 0) (achromatic).
 * Falls back to #000000 on parse failure.
 */
export function oklchToHex(oklch: string): string {
	const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
	if (!match) return "#000000"

	const L = Number(match[1])
	const C = Number(match[2])
	const H = Number(match[3])

	// oklch -> oklab
	const hRad = (H * Math.PI) / 180
	const a = C * Math.cos(hRad)
	const b = C * Math.sin(hRad)

	// oklab -> linear sRGB
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b
	const s_ = L - 0.0894841775 * a - 1.2914855480 * b

	const l = l_ * l_ * l_
	const m = m_ * m_ * m_
	const s = s_ * s_ * s_

	const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
	const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
	const bv = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

	const gamma = (x: number): number => {
		const clamped = Math.max(0, Math.min(1, x))
		return clamped <= 0.0031308
			? clamped * 12.92
			: 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
	}

	const toHex = (x: number): string =>
		Math.round(gamma(x) * 255)
			.toString(16)
			.padStart(2, "0")

	return `#${toHex(r)}${toHex(g)}${toHex(bv)}`
}
