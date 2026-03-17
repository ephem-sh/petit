import { List, MagnifyingGlass } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { ThemeSwitcher } from "@/components/theme-switcher"

/** Props for the DocsHeader component */
interface DocsHeaderProps {
	/** Site title displayed in the header */
	title: string
	/** Callback to open the search dialog */
	onSearchOpen: () => void
	/** Callback to open the mobile navigation drawer */
	onMobileMenuOpen: () => void
	/** Whether to show the color scheme switcher */
	schemeSwitcher: boolean
}

/** Sticky top header bar with mobile menu, search, and theme toggle */
function DocsHeader({ title, onSearchOpen, onMobileMenuOpen, schemeSwitcher }: DocsHeaderProps) {
	return (
		<header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4">
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					className="lg:hidden"
					onClick={onMobileMenuOpen}
					aria-label="Open menu"
				>
					<List className="size-4" />
				</Button>
				<span className="text-sm font-semibold tracking-tight">{title}</span>
			</div>

			<div className="ml-auto flex items-center gap-1">
				<Button
					variant="outline"
					className="hidden h-8 w-56 justify-between text-muted-foreground sm:flex"
					onClick={onSearchOpen}
				>
					<span className="flex items-center gap-2">
						<MagnifyingGlass className="size-3.5" />
						<span>Search docs...</span>
					</span>
					<kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
						<span className="text-[11px]">&#8984;</span>K
					</kbd>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="sm:hidden"
					onClick={onSearchOpen}
					aria-label="Search"
				>
					<MagnifyingGlass className="size-4" />
				</Button>
				{schemeSwitcher && <ThemeSwitcher />}
			</div>
		</header>
	)
}

export { DocsHeader }
export type { DocsHeaderProps }
