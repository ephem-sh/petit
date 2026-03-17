import type { ReactNode } from "react"
import { oklchToHex } from "./colors"

/** Props for the OG image template */
interface OgTemplateProps {
	/** Page title */
	title: string
	/** Page description (optional) */
	description?: string
	/** Site name */
	siteName: string
	/** Background color in oklch format */
	bgColor: string
	/** Foreground/text color in oklch format */
	fgColor: string
	/** Muted text color in oklch format */
	mutedColor: string
}

/**
 * Generate the satori-compatible JSX element for an OG image.
 * Returns a React element tree that satori can render to SVG.
 * Dimensions: 1200x630.
 */
export function createOgTemplate(props: OgTemplateProps): ReactNode {
	const bg = oklchToHex(props.bgColor)
	const fg = oklchToHex(props.fgColor)
	const muted = oklchToHex(props.mutedColor)

	return {
		type: "div",
		props: {
			style: {
				width: "1200px",
				height: "630px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "80px",
				backgroundColor: bg,
				fontFamily: "Inter",
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "16px",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										fontSize: "24px",
										color: muted,
										letterSpacing: "-0.01em",
									},
									children: props.siteName,
								},
							},
							{
								type: "div",
								props: {
									style: {
										fontSize: "56px",
										fontWeight: 700,
										color: fg,
										letterSpacing: "-0.03em",
										lineHeight: 1.15,
										overflow: "hidden",
										textOverflow: "ellipsis",
										maxHeight: "260px",
									},
									children: props.title,
								},
							},
						],
					},
				},
				props.description
					? {
							type: "div",
							props: {
								style: {
									fontSize: "24px",
									color: muted,
									lineHeight: 1.5,
									overflow: "hidden",
									textOverflow: "ellipsis",
									maxHeight: "108px",
								},
								children: props.description,
							},
						}
					: {
							type: "div",
							props: {
								style: { display: "flex" },
								children: [],
							},
						},
			],
		},
	} as unknown as ReactNode
}
