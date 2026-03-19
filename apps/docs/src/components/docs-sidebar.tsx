import { Link, type LinkProps } from "@tanstack/react-router"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@workspace/ui/components/sidebar"
import { ThemeSwitcher } from "@/components/theme-switcher"

/** A sidebar entry */
interface SidebarEntryItem {
	label: string
	slug: string
	draft: boolean
}

/** A sidebar category containing entries */
interface SidebarCategoryItem {
	label: string
	entries: SidebarEntryItem[]
	children?: SidebarCategoryItem[]
	depth: number
}

/** Props for the DocsSidebar component */
interface SidebarProps {
	/** Array of categories with their entries */
	sidebar: SidebarCategoryItem[]
	/** Currently active slug for highlighting */
	currentSlug: string
	/** Callback to open the search dialog */
	onSearchOpen: () => void
	/** Whether to show the color scheme switcher */
	schemeSwitcher: boolean
	/** Site title */
	title: string
	/** Logo URL */
	logo?: string
	/** Dark mode logo URL */
	logoDark?: string
	/** Sidebar side (for shadcn Sidebar) */
	side?: "left" | "right"
}

/** Flatten categories and their children into a flat list for rendering */
function flattenCategories(categories: SidebarCategoryItem[]): SidebarCategoryItem[] {
	const result: SidebarCategoryItem[] = []
	for (const cat of categories) {
		result.push(cat)
		if (cat.children) {
			result.push(...flattenCategories(cat.children))
		}
	}
	return result
}

/** Sidebar navigation with categories and entry links */
function DocsSidebar({ sidebar, currentSlug, onSearchOpen, schemeSwitcher, title, logo, logoDark, side }: SidebarProps) {
	return (
		<Sidebar side={side}>
			<SidebarHeader className="p-4">
				<Link to="/" aria-label={title} className="flex items-center gap-2 text-sm font-semibold tracking-tight pt-6 pb-8">
					{logo ? (
						<>
							<img src={logo} alt={title} className={logoDark ? "h-9 dark:hidden" : "h-9"} />
							{logoDark && <img src={logoDark} alt={title} className="h-9 hidden dark:block" />}
						</>
					) : (
						title
					)}
				</Link>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						className="h-8 flex-1 justify-between text-muted-foreground rounded-full"
						onClick={onSearchOpen}
						aria-label="Search documentation"
					>
						<span className="flex items-center gap-2">
							<MagnifyingGlass className="size-3.5" />
							<span className="text-xs">Search...</span>
						</span>
						<kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
							<span className="text-[11px]">&#8984;</span>K
						</kbd>
					</Button>
					{schemeSwitcher && <ThemeSwitcher />}
				</div>
			</SidebarHeader>
			<SidebarContent className="pb-16">
				{flattenCategories(sidebar).map((category) => (
					<SidebarGroup key={category.label}>
						<SidebarGroupLabel className="text-xs font-semibold tracking-wider uppercase">
							{category.label}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{category.entries.map((entry) => (
									<SidebarMenuItem key={entry.slug}>
										<SidebarMenuButton asChild isActive={currentSlug === entry.slug}>
											<Link to={`/${entry.slug}` as LinkProps["to"]} aria-current={currentSlug === entry.slug ? "page" : undefined}>
												{entry.label}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
		</Sidebar>
	)
}

export { DocsSidebar }
export type { SidebarProps, SidebarCategoryItem, SidebarEntryItem }
