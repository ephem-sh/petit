import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

/** A heading entry for the table of contents */
interface TocHeading {
	depth: number
	text: string
	id: string
}

/** Props for the TableOfContents component */
interface TableOfContentsProps {
	/** Headings extracted from the document */
	headings: TocHeading[]
}

/** Sticky table of contents sidebar with scroll-spy active heading tracking */
function TableOfContents({ headings }: TableOfContentsProps) {
	const [activeId, setActiveId] = useState<string>("")
	const observerRef = useRef<IntersectionObserver | null>(null)

	const filtered = useMemo(
		() => headings.filter((h) => h.depth === 2 || h.depth === 3),
		[headings],
	)

	useEffect(() => {
		if (filtered.length === 0) return

		observerRef.current?.disconnect()

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id)
					}
				}
			},
			{ rootMargin: "0px 0px -80% 0px", threshold: 0.1 },
		)

		observerRef.current = observer

		for (const heading of filtered) {
			const el = document.getElementById(heading.id)
			if (el) observer.observe(el)
		}

		return () => observer.disconnect()
	}, [filtered])

	if (filtered.length === 0) return null

	return (
		<nav className="sticky top-20">
			<p className="mb-3 text-xs font-medium text-muted-foreground">On this page</p>
			<ul className="space-y-1">
				{filtered.map((heading) => (
					<li key={heading.id}>
						<a
							href={`#${heading.id}`}
							className={cn(
								"block text-xs leading-6 text-muted-foreground transition-colors hover:text-foreground",
								heading.depth === 3 && "pl-3",
								activeId === heading.id && "text-foreground font-medium",
							)}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	)
}

export { TableOfContents }
export type { TocHeading, TableOfContentsProps }
