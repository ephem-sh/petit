import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"

/**
 * Rehype plugin that transforms youtube/vimeo code fences into responsive video embeds.
 *
 * @example
 * ```youtube
 * dQw4w9WgXcQ
 * ```
 *
 * ```vimeo
 * 123456789
 * ```
 */
export function rehypeVideo() {
	return (tree: Root): void => {
		visit(tree, "element", (node: Element, index, parent) => {
			if (node.tagName !== "pre" || index === undefined || !parent) return

			const codeEl = node.children.find(
				(c): c is Element => c.type === "element" && c.tagName === "code",
			)
			if (!codeEl) return

			const className = codeEl.properties?.className
			if (!Array.isArray(className)) return

			const isYoutube = className.some((c) => c === "language-youtube")
			const isVimeo = className.some((c) => c === "language-vimeo")
			if (!isYoutube && !isVimeo) return

			const videoId = (
				codeEl.children[0] && codeEl.children[0].type === "text"
					? codeEl.children[0].value
					: ""
			).trim()

			if (!videoId) return

			const src = isYoutube
				? `https://www.youtube-nocookie.com/embed/${videoId}`
				: `https://player.vimeo.com/video/${videoId}`

			const iframe: Element = {
				type: "element",
				tagName: "div",
				properties: {
					className: ["petit-video"],
					style: "position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.5rem;margin:1rem 0;",
				},
				children: [
					{
						type: "element",
						tagName: "iframe",
						properties: {
							src,
							style: "position:absolute;top:0;left:0;width:100%;height:100%;border:0;",
							allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
							allowFullScreen: true,
							loading: "lazy",
							title: isYoutube ? "YouTube video" : "Vimeo video",
						},
						children: [],
					},
				],
			}

			;(parent as Element | Root).children[index] = iframe
		})
	}
}
