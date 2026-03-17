import { useEffect, useState } from "react"
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
	useRouterState,
} from "@tanstack/react-router"
import {
	SidebarProvider,
	SidebarInset,
	SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { config } from "@/.petit/config"
import { sidebar } from "@/.petit/sidebar"
import { configError } from "@/.petit/error"

/** Inline script that runs before paint to apply the theme class and prevent flash */
const themeScript = `(function(){try{var t=localStorage.getItem("petit-theme")||"${config.defaultScheme}";var d=t==="system"?window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":t;document.documentElement.classList.toggle("dark",d==="dark")}catch(e){}})()`
import { ThemeProvider } from "@/components/theme-provider"
import { DocsSidebar } from "@/components/docs-sidebar"
import { ConfigError } from "@/components/config-error"
import { SearchDialog } from "@/components/search-dialog"

import "@/.petit/theme.css"
import appCss from "@workspace/ui/globals.css?url"

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "theme-color",
				content: "#000000",
			},
		],
		links: [
			...(config.favicon
				? [{ rel: "icon", href: config.favicon }]
				: []),
			{
				rel: "manifest",
				href: "/manifest.json",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "stylesheet",
				href: "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css",
			},
			{
				rel: "alternate",
				type: "text/markdown",
				href: "/llms-full.md",
				title: "Full documentation for LLMs",
			},
		],
		scripts: [
			{
				children: themeScript,
			},
		],
	}),
	component: RootLayout,
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}

function RootLayout() {
	const [searchOpen, setSearchOpen] = useState(false)
	const location = useRouterState({ select: (s) => s.location })
	const currentSlug = location.pathname.replace(/^\//, "")

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault()
				setSearchOpen(true)
			}
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [])

	useEffect(() => {
		if ("serviceWorker" in navigator && import.meta.env.PROD) {
			void navigator.serviceWorker.register("/sw.js")
		}
	}, [])

	if (configError) {
		return <ConfigError error={configError} />
	}

	const pos = config.sidebarPosition

	return (
		<ThemeProvider defaultScheme={config.defaultScheme}>
			<div className={pos === "center" ? "petit-layout-center" : ""}>
				<SidebarProvider>
					{pos === "right" ? (
						<>
							<SidebarInset>
								<header className="flex h-12 items-center gap-2 px-4 md:hidden">
									<SidebarTrigger />
								</header>
								<Outlet />
							</SidebarInset>
							<DocsSidebar
								sidebar={sidebar}
								currentSlug={currentSlug}
								onSearchOpen={() => setSearchOpen(true)}
								schemeSwitcher={config.schemeSwitcher}
								title={config.title}
								logo={config.logo ?? undefined}
								side="right"
							/>
						</>
					) : (
						<>
							<DocsSidebar
								sidebar={sidebar}
								currentSlug={currentSlug}
								onSearchOpen={() => setSearchOpen(true)}
								schemeSwitcher={config.schemeSwitcher}
								title={config.title}
								logo={config.logo ?? undefined}
							/>
							<SidebarInset>
								<header className="flex h-12 items-center gap-2 px-4 md:hidden">
									<SidebarTrigger />
								</header>
								<Outlet />
							</SidebarInset>
						</>
					)}
				</SidebarProvider>
			</div>
			<SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
		</ThemeProvider>
	)
}
