import { createFileRoute, Navigate } from "@tanstack/react-router"
import { sidebar } from "virtual:petit/sidebar"

export const Route = createFileRoute("/")({
	component: IndexRedirect,
})

/** Redirects to the first available doc or shows empty state */
function IndexRedirect() {
	const firstEntry = sidebar
		.flatMap((category) => category.entries)
		.find((entry) => !entry.draft)

	if (!firstEntry) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<h1 className="text-2xl font-semibold mb-2">No docs found</h1>
					<p className="text-muted-foreground">
						Add markdown files to your docs directory to get started.
					</p>
				</div>
			</div>
		)
	}

	return <Navigate to={"/" + firstEntry.slug} />
}
