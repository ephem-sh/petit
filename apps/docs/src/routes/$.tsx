import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router"
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react"
import { config } from "@/.petit/config"
import { docs } from "@/.petit/docs"
import { sidebar } from "@/.petit/sidebar"
import { ContentRenderer } from "@/components/content-renderer"
import { DocActions } from "@/components/doc-actions"
import { TableOfContents } from "@/components/table-of-contents"

/** Flat list of all doc entries in sidebar order */
const allEntries = sidebar.flatMap((cat) =>
	cat.entries.filter((e) => !e.draft).map((e) => ({ label: e.label, slug: e.slug })),
)

const MAX_WIDTH_MAP = {
	sm: "max-w-4xl",
	md: "max-w-5xl",
	lg: "max-w-6xl",
	xl: "max-w-7xl",
} as const

export const Route = createFileRoute("/$")({
	head: ({ params }) => {
		const slug = params._splat ?? ""
		const doc = slug ? docs[slug] : undefined
		const title = doc?.frontmatter.title
		const description = doc?.frontmatter.description
		const pageTitle = title ? `${title} | ${config.title}` : config.title
		const siteUrl = config.siteUrl
		const canonicalUrl = siteUrl ? `${siteUrl}/${slug}` : undefined
		const ogImageSlug = (slug.includes("/") ? slug.slice(slug.indexOf("/") + 1) : slug).replace(/\//g, "-")
		const ogImageUrl = siteUrl ? `${siteUrl}/og/${ogImageSlug}.png` : undefined

		return {
			meta: [
				{ title: pageTitle },
				...(description ? [{ name: "description", content: description }] : []),
				{ name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
				{ property: "og:type", content: "article" },
				{ property: "og:title", content: title ?? config.title },
				...(description ? [{ property: "og:description", content: description }] : []),
				{ property: "og:site_name", content: config.title },
				...(canonicalUrl ? [{ property: "og:url", content: canonicalUrl }] : []),
				...(ogImageUrl ? [{ property: "og:image", content: ogImageUrl }] : []),
				...(ogImageUrl ? [{ property: "og:image:width", content: "1200" }] : []),
				...(ogImageUrl ? [{ property: "og:image:height", content: "630" }] : []),
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: title ?? config.title },
				...(description ? [{ name: "twitter:description", content: description }] : []),
				...(ogImageUrl ? [{ name: "twitter:image", content: ogImageUrl }] : []),
				...(doc?.lastModified ? [{ property: "article:modified_time", content: doc.lastModified }] : []),
			],
			links: [
				...(canonicalUrl ? [{ rel: "canonical", href: canonicalUrl }] : []),
			],
			scripts: description
				? [
						{
							type: "application/ld+json",
							children: JSON.stringify({
								"@context": "https://schema.org",
								"@type": "TechArticle",
								headline: title ?? config.title,
								description,
								...(canonicalUrl ? { url: canonicalUrl } : {}),
								...(ogImageUrl ? { image: ogImageUrl } : {}),
								...(doc?.lastModified ? { dateModified: doc.lastModified } : {}),
							}),
						},
					]
				: [],
		}
	},
	component: DocPage,
})

/** Renders a single doc page with content and table of contents */
function DocPage() {
	const { _splat: slug } = Route.useParams()
	const doc = slug ? docs[slug] : undefined

	if (!doc) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center p-8">
				<div className="max-w-md text-center space-y-3">
					<p className="text-6xl font-bold text-muted-foreground/30">404</p>
					<h1 className="text-xl font-semibold">Page not found</h1>
					<p className="text-sm text-muted-foreground">
						The page <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">/{slug}</code> doesn't exist in the documentation.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className={`mx-auto flex w-full ${MAX_WIDTH_MAP[config.maxWidth]} gap-10 px-8 py-10 lg:px-16`}>
			<article className="min-w-0 flex-1">
				{doc.frontmatter.title && (
					<header className="mb-8">
						<h1 className="text-3xl font-bold tracking-tight">
							{doc.frontmatter.title}
						</h1>
						{doc.frontmatter.description && (
							<p className="mt-2 text-lg text-muted-foreground">
								{doc.frontmatter.description}
							</p>
						)}
						<div className="mt-4">
							<DocActions raw={doc.raw} title={doc.frontmatter.title} filePath={doc.filePath} repository={config.repository} branch={config.branch} />
						</div>
						{doc.lastModified && (
							<p className="mt-3 text-xs text-muted-foreground">
								Last updated {new Date(doc.lastModified).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						)}
					</header>
				)}
				{!doc.frontmatter.title && (
					<div className="mb-6">
						<DocActions raw={doc.raw} title={slug ?? ""} filePath={doc.filePath} repository={config.repository} branch={config.branch} />
					</div>
				)}
				<ContentRenderer html={doc.html} />
				<DocPagination slug={slug ?? ""} />
			</article>

			{config.toc && doc.headings.length > 0 && (
				<aside className="hidden xl:block w-[200px] shrink-0">
					<div className="sticky top-10">
						<TableOfContents headings={doc.headings} />
					</div>
				</aside>
			)}
		</div>
	)
}

function DocPagination({ slug }: { slug: string }) {
	const idx = allEntries.findIndex((e) => e.slug === slug)
	if (idx === -1) return null

	const prev = idx > 0 ? allEntries[idx - 1] : undefined
	const next = idx < allEntries.length - 1 ? allEntries[idx + 1] : undefined

	if (!prev && !next) return null

	return (
		<nav className="mt-16 flex items-center justify-between border-t pt-6" aria-label="Pagination">
			{prev ? (
				<Link
					to={`/${prev.slug}` as LinkProps["to"]}
					className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
					aria-label={"Previous: " + prev.label}
				>
					<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
					{prev.label}
				</Link>
			) : (
				<span />
			)}
			{next && (
				<Link
					to={`/${next.slug}` as LinkProps["to"]}
					className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
					aria-label={"Next: " + next.label}
				>
					{next.label}
					<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
				</Link>
			)}
		</nav>
	)
}
