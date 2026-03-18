import { useEffect, useRef } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { themes } from "@/.petit/themes"

/** Props for the ContentRenderer component */
interface ContentRendererProps {
	/** HTML string to render */
	html: string
	/** Additional class names */
	className?: string
}

/** Hydrates `.petit-install-tabs` elements with interactive tab switching */
function hydrateInstallTabs(container: HTMLElement): void {
	const tabContainers = container.querySelectorAll<HTMLElement>(".petit-install-tabs, .petit-tabs")
	for (const tabContainer of tabContainers) {
		const radios = tabContainer.querySelectorAll<HTMLInputElement>('input[type="radio"]')
		const panels = tabContainer.querySelectorAll<HTMLElement>(".petit-tab-panel")
		const labels = tabContainer.querySelectorAll<HTMLElement>(".petit-tab-label")

		panels.forEach((panel, i) => {
			panel.style.display = i === 0 ? "" : "none"
		})

		for (const radio of radios) {
			radio.addEventListener("change", () => {
				const value = radio.value
				panels.forEach((panel) => {
					panel.style.display = panel.dataset.tab === value ? "" : "none"
				})
				labels.forEach((label) => {
					label.classList.toggle("petit-tab-active", label.dataset.tab === value)
				})
			})
		}
	}
}

/** Adds copy-to-clipboard buttons to all `pre[data-code]` elements */
function hydrateCopyButtons(container: HTMLElement): void {
	const codeBlocks = container.querySelectorAll<HTMLElement>("pre[data-code]")
	for (const block of codeBlocks) {
		if (block.querySelector(".petit-copy-btn")) continue

		const btn = document.createElement("button")
		btn.type = "button"
		btn.className = "petit-copy-btn"
		btn.textContent = "Copy"
		btn.setAttribute("aria-label", "Copy code")
		btn.addEventListener("click", async () => {
			const code = block.dataset.code ?? ""
			await navigator.clipboard.writeText(code)
			btn.textContent = "Copied!"
			btn.setAttribute("aria-label", "Copied")
			setTimeout(() => {
				btn.textContent = "Copy"
				btn.setAttribute("aria-label", "Copy code")
			}, 2000)
		})

		block.style.position = "relative"
		block.appendChild(btn)
	}
}

/** Lazy-loads mermaid and renders all `.petit-mermaid` diagram containers */
async function hydrateMermaid(container: HTMLElement): Promise<void> {
	const mermaidContainers = container.querySelectorAll<HTMLElement>(".petit-mermaid")
	if (mermaidContainers.length === 0) return

	try {
		const { default: mermaid } = await import("mermaid")
		mermaid.initialize({ startOnLoad: false, theme: "dark" })

		for (const el of mermaidContainers) {
			const source = el.dataset.mermaidSource
			if (!source) continue

			try {
				const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`
				const { svg } = await mermaid.render(id, source)
				el.innerHTML = svg
			} catch {
				// Keep fallback pre visible
			}
		}
	} catch {
		// Mermaid failed to load, skip rendering
	}
}

const COPY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>'
const CHECK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>'

/** Adds a small copy button after each heading that copies its anchor URL */
function hydrateCopyHeadingLinks(container: HTMLElement): void {
	const headings = container.querySelectorAll<HTMLElement>("h2[id], h3[id], h4[id]")

	for (const heading of headings) {
		const btn = document.createElement("button")
		btn.type = "button"
		btn.className = "petit-copy-heading"
		btn.innerHTML = COPY_ICON
		btn.title = "Copy link"
		btn.setAttribute("aria-label", "Copy link to section")

		btn.addEventListener("click", (e) => {
			e.preventDefault()
			e.stopPropagation()
			const url = `${window.location.origin}${window.location.pathname}#${heading.id}`
			window.history.replaceState(null, "", `#${heading.id}`)

			void navigator.clipboard.writeText(url).then(() => {
				btn.innerHTML = CHECK_ICON
				btn.classList.add("copied")
				setTimeout(() => {
					btn.innerHTML = COPY_ICON
					btn.classList.remove("copied")
				}, 1500)
			})
		})

		heading.appendChild(btn)
	}
}

/** Injects SVG icons into callout titles based on the parent callout type class */
function hydrateCalloutIcons(container: HTMLElement): void {
	const icons: Record<string, string> = {
		"petit-callout-note": '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24Zm0,192H56V40H200ZM88,64a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H96A8,8,0,0,1,88,64Z"/></svg>',
		"petit-callout-tip": '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Z"/></svg>',
		"petit-callout-info": '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V96a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20-84a12,12,0,1,1-12-12A12,12,0,0,1,140,52Z"/></svg>',
		"petit-callout-warning": '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>',
		"petit-callout-danger": '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/></svg>',
	}

	const titles = container.querySelectorAll<HTMLElement>(".petit-callout-title")
	for (const title of titles) {
		const callout = title.parentElement
		if (!callout) continue

		for (const [cls, svg] of Object.entries(icons)) {
			if (callout.classList.contains(cls)) {
				title.insertAdjacentHTML("afterbegin", svg)
				break
			}
		}
	}
}

/** Animate content as it scrolls into view. Above-the-fold content appears instantly. */
/** Intercepts accordion open/close for smooth animated transitions using Motion */
function hydrateAccordions(container: HTMLElement): void {
	const items = container.querySelectorAll<HTMLDetailsElement>(".petit-accordion-item")
	let motionAnimate: typeof import("motion").animate | null = null

	// Preload motion
	void import("motion").then((m) => { motionAnimate = m.animate })

	for (const details of items) {
		const content = details.querySelector<HTMLElement>(".petit-accordion-content")
		const trigger = details.querySelector<HTMLElement>(".petit-accordion-trigger")
		const icon = trigger?.querySelector<HTMLElement>(":scope::after") ? null : trigger // ::after can't be animated directly
		if (!content || !trigger) continue

		let isAnimating = false

		details.addEventListener("click", async (e) => {
			if (!trigger.contains(e.target as Node)) return
			e.preventDefault()
			if (isAnimating) return
			isAnimating = true

			// Lazy fallback if preload hasn't finished
			if (!motionAnimate) {
				const m = await import("motion")
				motionAnimate = m.animate
			}

			if (details.open) {
				// Close: animate everything down together
				const h = content.scrollHeight
				content.style.height = `${h}px`
				content.style.overflow = "hidden"

				await motionAnimate(content, { height: "0px", opacity: 0 }, {
					duration: 0.15,
					ease: [0.16, 1, 0.3, 1],
				}).finished

				details.open = false
				content.style.height = ""
				content.style.opacity = ""
				content.style.overflow = ""
			} else {
				// Open: render content, measure, animate from 0
				content.style.height = "0px"
				content.style.opacity = "0"
				content.style.overflow = "hidden"
				details.open = true

				const h = content.scrollHeight

				await motionAnimate(content, { height: `${h}px`, opacity: 1 }, {
					duration: 0.2,
					ease: [0.22, 1, 0.36, 1],
				}).finished

				content.style.height = ""
				content.style.opacity = ""
				content.style.overflow = ""
			}

			isAnimating = false
		})
	}
}

function hydrateScrollAnimations(container: HTMLElement): void {
	const targets = Array.from(container.children).filter(
		(el): el is HTMLElement => el instanceof HTMLElement,
	)

	if (targets.length === 0) return

	const viewportHeight = window.innerHeight

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					const el = entry.target as HTMLElement
					el.style.opacity = "1"
					el.style.transform = "translateY(0)"
					observer.unobserve(el)
				}
			}
		},
		{ threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
	)

	for (const target of targets) {
		const rect = target.getBoundingClientRect()
		// Above the fold — show immediately, no animation
		if (rect.top < viewportHeight) {
			continue
		}
		// Below the fold — set up for scroll-triggered animation
		target.style.opacity = "0"
		target.style.transform = "translateY(12px)"
		target.style.transition = "opacity 350ms var(--ease-spring), transform 350ms var(--ease-spring)"
		observer.observe(target)
	}
}

/** Hydrates `[data-petit-theme-preview]` placeholders with interactive theme-switching buttons */
function hydrateThemePreview(container: HTMLElement): void {
	const targets = container.querySelectorAll<HTMLElement>("[data-petit-theme-preview]")
	if (targets.length === 0) return

	const themeNames = Object.keys(themes)
	if (themeNames.length === 0) return

	const root = document.documentElement
	const isDark = () => root.classList.contains("dark")
	let activeTheme: string | null = null

	const applyTheme = (name: string) => {
		const scheme = isDark() ? "dark" : "light"
		const colors = themes[name]?.[scheme]
		if (!colors) return
		for (const [key, value] of Object.entries(colors)) {
			root.style.setProperty(`--${key}`, value)
		}
	}

	const clearTheme = () => {
		const current = themes[Object.keys(themes)[0]]
		if (!current) return
		const keys = Object.keys(current.light)
		for (const key of keys) {
			root.style.removeProperty(`--${key}`)
		}
		activeTheme = null
	}

	// Re-apply preview theme when light/dark toggles
	const observer = new MutationObserver(() => {
		if (activeTheme) applyTheme(activeTheme)
	})
	observer.observe(root, { attributes: true, attributeFilter: ["class"] })

	for (const target of targets) {
		const wrapper = document.createElement("div")
		wrapper.className = "flex flex-wrap gap-2 my-4"

		for (const name of themeNames) {
			const btn = document.createElement("button")
			btn.type = "button"
			btn.textContent = name.charAt(0).toUpperCase() + name.slice(1)
			btn.className =
				"px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-secondary hover:bg-accent transition-colors cursor-pointer"
			btn.dataset.themeName = name
			btn.setAttribute("aria-label", `Preview ${name} theme`)
			btn.setAttribute("aria-pressed", "false")

			btn.addEventListener("click", () => {
				if (activeTheme === name) {
					clearTheme()
					for (const b of wrapper.querySelectorAll("button")) {
						b.classList.remove("ring-2", "ring-primary")
						b.setAttribute("aria-pressed", "false")
					}
					return
				}
				activeTheme = name
				applyTheme(name)
				for (const b of wrapper.querySelectorAll("button")) {
					b.classList.remove("ring-2", "ring-primary")
					b.setAttribute("aria-pressed", "false")
				}
				btn.classList.add("ring-2", "ring-primary")
				btn.setAttribute("aria-pressed", "true")
			})

			wrapper.appendChild(btn)
		}

		target.replaceWith(wrapper)
	}
}

/** Renders pre-compiled HTML content with prose typography styling and hydrates interactive elements */
function ContentRenderer({ html, className }: ContentRendererProps) {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!ref.current) return

		hydrateInstallTabs(ref.current)
		hydrateCopyButtons(ref.current)
		hydrateCopyHeadingLinks(ref.current)
		hydrateCalloutIcons(ref.current)
		hydrateAccordions(ref.current)
		hydrateThemePreview(ref.current)
		void hydrateMermaid(ref.current)
		hydrateScrollAnimations(ref.current)
	}, [html])

	return (
		<div
			ref={ref}
			className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	)
}

export { ContentRenderer }
export type { ContentRendererProps }
