import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@workspace/ui/components/command"
import { FileText, Hash, Moon, Sun, Link, GithubLogo, ArrowRight } from "@phosphor-icons/react"
import { create, load, search as oramaSearch } from "@orama/orama"
import type { AnyOrama } from "@orama/orama"
import { searchIndex } from "@/.petit/search"
import { useTheme } from "@/components/theme-provider"
import { sidebar } from "@/.petit/sidebar"
import { config } from "@/.petit/config"

/** Props for the SearchDialog component */
interface SearchDialogProps {
	/** Whether the dialog is open */
	open: boolean
	/** Callback when the open state changes */
	onOpenChange: (open: boolean) => void
}

interface SearchResult {
	title: string
	description: string
	slug: string
	category: string
	headingId: string
}

const searchSchema = {
	slug: "string",
	title: "string",
	description: "string",
	content: "string",
	category: "string",
	headingId: "string",
} as const

interface Command {
	id: string
	label: string
	icon: typeof Sun
	action: () => void
}

interface NavCommand {
	id: string
	label: string
	category: string
	slug: string
}

/** Search and command palette dialog powered by Orama */
function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
	const navigate = useNavigate()
	const [query, setQuery] = useState("")
	const [results, setResults] = useState<SearchResult[]>([])
	const dbRef = useRef<ReturnType<typeof create<typeof searchSchema>> | null>(null)
	const { resolvedTheme, setTheme } = useTheme()

	const isCommandMode = query.startsWith(">")
	const commandQuery = isCommandMode ? query.slice(1).trim() : ""

	const commands = useMemo<Command[]>(() => [
		{
			id: "toggle-theme",
			label: resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
			icon: resolvedTheme === "dark" ? Sun : Moon,
			action: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
		},
		{
			id: "copy-url",
			label: "Copy page URL",
			icon: Link,
			action: () => void navigator.clipboard.writeText(window.location.href),
		},
		...(config.repository ? [{
			id: "github",
			label: "Open on GitHub",
			icon: GithubLogo,
			action: () => window.open(config.repository!, "_blank"),
		}] : []),
	], [resolvedTheme, setTheme])

	const navCommands = useMemo<NavCommand[]>(() =>
		sidebar.flatMap(cat =>
			cat.entries.filter(e => !e.draft).map(e => ({
				id: `go-${e.slug}`,
				label: e.label,
				category: cat.label,
				slug: e.slug,
			}))
		),
	[])

	useEffect(() => {
		if (!searchIndex || dbRef.current) return
		const instance = create({ schema: searchSchema })
		load(instance as AnyOrama, searchIndex)
		dbRef.current = instance
	}, [])

	useEffect(() => {
		if (isCommandMode) {
			setResults([])
			return
		}

		const db = dbRef.current
		if (!db || !query.trim()) {
			setResults([])
			return
		}

		const run = async () => {
			const res = await oramaSearch(db, {
				term: query,
				limit: 15,
				boost: {
					title: 5,
					description: 2,
					content: 1,
				},
			})

			// Deduplicate: if a page and its heading both match,
			// keep the heading (more specific) and drop the page
			// unless the page ranked higher
			const seen = new Map<string, number>()
			const hits: SearchResult[] = []

			for (let i = 0; i < res.hits.length; i++) {
				const hit = res.hits[i]
				const doc = hit.document
				const slug = doc.slug as string
				const headingId = doc.headingId as string
				const key = headingId ? `${slug}#${headingId}` : slug

				if (seen.has(key)) continue
				seen.set(key, i)

				hits.push({
					title: doc.title as string,
					description: doc.description as string,
					slug,
					category: doc.category as string,
					headingId,
				})
			}

			setResults(hits)
		}
		void run()
	}, [query, isCommandMode])

	const handleSelect = useCallback(
		(slug: string, headingId: string) => {
			onOpenChange(false)
			setQuery("")
			const path = headingId ? `/${slug}#${headingId}` : `/${slug}`
			void navigate({ to: path })
		},
		[navigate, onOpenChange],
	)

	const grouped = results.reduce<Record<string, SearchResult[]>>(
		(acc, result) => {
			const group = acc[result.category] ?? []
			group.push(result)
			acc[result.category] = group
			return acc
		},
		{},
	)

	return (
		<CommandDialog
			open={open}
			onOpenChange={(v) => {
				onOpenChange(v)
				if (!v) setQuery("")
			}}
			title="Search Documentation"
			description="Search for pages and content"
		>
			<CommandInput
				placeholder={isCommandMode ? "Type a command..." : "Search docs... (type > for commands)"}
				value={query}
				onValueChange={setQuery}
			/>
			<CommandList>
				{isCommandMode ? (
					<>
						<CommandEmpty>No commands found.</CommandEmpty>
						<CommandGroup heading="Actions">
							{commands
								.filter(c => c.label.toLowerCase().includes(commandQuery.toLowerCase()))
								.map(c => (
									<CommandItem
										key={c.id}
										value={c.label}
										onSelect={() => {
											c.action()
											onOpenChange(false)
											setQuery("")
										}}
									>
										<c.icon className="size-3.5 shrink-0 text-muted-foreground" />
										<span className="text-xs">{c.label}</span>
									</CommandItem>
								))}
						</CommandGroup>
						<CommandGroup heading="Go to page">
							{navCommands
								.filter(c => c.label.toLowerCase().includes(commandQuery.toLowerCase()))
								.map(c => (
									<CommandItem
										key={c.id}
										value={`${c.label} ${c.category}`}
										onSelect={() => {
											onOpenChange(false)
											setQuery("")
											void navigate({ to: `/${c.slug}` })
										}}
									>
										<ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
										<div className="flex flex-col gap-0.5 min-w-0">
											<span className="text-xs font-medium truncate">{c.label}</span>
											<span className="text-[11px] text-muted-foreground truncate">{c.category}</span>
										</div>
									</CommandItem>
								))}
						</CommandGroup>
					</>
				) : (
					<>
						<CommandEmpty>
							{query.trim() ? "No results found." : "Type to search..."}
						</CommandEmpty>
						{Object.entries(grouped).map(([category, hits]) => (
							<CommandGroup key={category} heading={category}>
								{hits.map((result) => (
									<CommandItem
										key={`${result.slug}${result.headingId ? `#${result.headingId}` : ""}`}
										value={`${result.title} ${result.description} ${result.slug}`}
										onSelect={() =>
											handleSelect(result.slug, result.headingId)
										}
									>
										{result.headingId ? (
											<Hash className="size-3.5 shrink-0 text-muted-foreground" />
										) : (
											<FileText className="size-3.5 shrink-0 text-muted-foreground" />
										)}
										<div className="flex flex-col gap-0.5 min-w-0">
											<span className="text-xs font-medium truncate">
												{result.title}
											</span>
											{result.description && (
												<span className="text-[11px] text-muted-foreground truncate">
													{result.headingId
														? result.description
														: result.description}
												</span>
											)}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</>
				)}
			</CommandList>
		</CommandDialog>
	)
}

export { SearchDialog }
export type { SearchDialogProps }
