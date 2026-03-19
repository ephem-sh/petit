import {
	Sheet,
	SheetContent,
} from "@workspace/ui/components/sheet"
import { DocsSidebar, type SidebarCategoryItem } from "@/components/docs-sidebar"

/** Props for the MobileNav component */
interface MobileNavProps {
	/** Whether the drawer is open */
	open: boolean
	/** Callback when the open state changes */
	onOpenChange: (open: boolean) => void
	/** Sidebar categories to render */
	sidebar: SidebarCategoryItem[]
	/** Currently active slug */
	currentSlug: string
	/** Callback to open the search dialog */
	onSearchOpen: () => void
	/** Whether to show the color scheme switcher */
	schemeSwitcher: boolean
	/** Site title */
	title: string
	/** Whether to show credits in the sidebar footer */
	credits: boolean
}

/** Mobile navigation drawer that wraps DocsSidebar in a left-side Sheet */
function MobileNav({ open, onOpenChange, sidebar, currentSlug, onSearchOpen, schemeSwitcher, title, credits }: MobileNavProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="left" className="w-72 p-0">
				<DocsSidebar
					sidebar={sidebar}
					currentSlug={currentSlug}
					onSearchOpen={onSearchOpen}
					schemeSwitcher={schemeSwitcher}
					title={title}
					credits={credits}
				/>
			</SheetContent>
		</Sheet>
	)
}

export { MobileNav }
export type { MobileNavProps }
