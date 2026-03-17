import { useState } from "react"
import { Copy, Check, CaretDown, FileText, FilePdf, ArrowUpRight } from "@phosphor-icons/react"
import { siGithub, siAnthropic } from "simple-icons"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@workspace/ui/components/button"

/** Icon configuration for an open link - exactly one should be provided */
interface OpenLink {
	label: string
	href: string
	onClick?: () => void
	/** SVG path data (simple-icons) */
	icon?: string
	/** Image src for custom icons */
	iconSrc?: string
	/** Phosphor icon component */
	phosphorIcon?: React.ComponentType<{ className?: string }>
}

interface DocActionsProps {
	/** Raw markdown content */
	raw: string
	/** Document title for context */
	title: string
	/** File path relative to repo root (e.g. "docs/getting-started/overview.md") */
	filePath?: string
	/** Repository URL (e.g. "https://github.com/user/repo") */
	repository?: string | null
	/** Branch name for GitHub links */
	branch?: string
}

/** Actions toolbar for doc pages: copy markdown, open in external tools */
function DocActions({ raw, title, filePath, repository, branch }: DocActionsProps) {
	const [copied, setCopied] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(raw)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const repoUrl = repository?.replace(/\/$/, "")
	const resolvedBranch = branch ?? "main"

	const openLinks: Array<OpenLink> = [
		...(repoUrl && filePath
			? [{
				label: "Open in GitHub",
				href: `${repoUrl}/blob/${resolvedBranch}/${filePath}`,
				icon: siGithub.path,
			}]
			: []),
		{
			label: "Open in ChatGPT",
			href: `https://chatgpt.com/?q=${encodeURIComponent(`Here is a documentation page titled "${title}":\n\n${raw}`)}`,
			iconSrc: "/custom/openai.png",
		},
		{
			label: "Open in Claude",
			href: `https://claude.ai/new?q=${encodeURIComponent(`Here is a documentation page titled "${title}":\n\n${raw}`)}`,
			icon: siAnthropic.path,
		},
		{
			label: "View as Markdown",
			href: "#",
			onClick: () => {
				const mdUrl = window.location.pathname.replace(/\/$/, "") + ".md"
				window.open(mdUrl, "_blank")
			},
			phosphorIcon: FileText,
		},
		{
			label: "Download as PDF",
			href: "#",
			onClick: () => window.print(),
			phosphorIcon: FilePdf,
		},
	]

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				className="h-7 gap-1.5 text-xs text-muted-foreground rounded-sm"
				onClick={handleCopy}
			>
				{copied ? (
					<>
						<Check className="size-3" />
						Copied
					</>
				) : (
					<>
						<Copy className="size-3" />
						Copy Markdown
					</>
				)}
			</Button>

			<div className="relative">
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1.5 text-xs text-muted-foreground rounded-sm"
					onClick={() => setMenuOpen(!menuOpen)}
				>
					Open
					<CaretDown className="size-3" />
				</Button>

				<AnimatePresence>
					{menuOpen && (
						<>
							<div
								className="fixed inset-0 z-40"
								onClick={() => setMenuOpen(false)}
							/>
							<motion.div
								initial={{ opacity: 0, scale: 0.96, y: -4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: -4 }}
								transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
								className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-md border bg-popover p-1.5 shadow-md"
							>
								{openLinks.map((link) => (
									<a
										key={link.label}
										href={link.onClick ? "#" : link.href}
										target={link.onClick ? undefined : "_blank"}
										rel={link.onClick ? undefined : "noopener noreferrer"}
										className="flex items-center gap-2 rounded-sm px-3 py-2 text-xs text-popover-foreground transition-colors hover:bg-accent print:hidden"
										onClick={(e) => {
											if (link.onClick) {
												e.preventDefault()
												link.onClick()
											}
											setMenuOpen(false)
										}}
									>
										{link.icon && (
											<svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
												<path d={link.icon} />
											</svg>
										)}
										{link.iconSrc && (
											<img src={link.iconSrc} alt="" className="size-3.5 shrink-0" />
										)}
										{link.phosphorIcon && (
											<link.phosphorIcon className="size-3.5 shrink-0" />
										)}
										<span className="flex-1">{link.label}</span>
										<ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
									</a>
								))}
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}

export { DocActions }
