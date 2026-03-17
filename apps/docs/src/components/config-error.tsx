import { Warning } from "@phosphor-icons/react"

/** Map of config fields to their valid values */
const FIELD_HINTS: Record<string, { description: string; values: string[] }> = {
	defaultScheme: {
		description: "Default color scheme for the site",
		values: ["dark", "light", "system"],
	},
	maxWidth: {
		description: "Maximum width of the content area",
		values: ["sm", "md", "lg", "xl"],
	},
	sidebarPosition: {
		description: "Position of the sidebar navigation",
		values: ["left", "right", "center"],
	},
	schemeSwitcher: {
		description: "Show the color scheme toggle",
		values: ["true", "false"],
	},
	theme: {
		description: "Named theme preset",
		values: ["default"],
	},
}

/** Props for the ConfigError component */
interface ConfigErrorProps {
	error: string
}

/** Renders a helpful error page when config validation fails */
function ConfigError({ error }: ConfigErrorProps) {
	const fieldMatch = error.match(/(?:at|field|property)\s+"?(\w+)"?/i)
		?? error.match(/"(\w+)"/i)
	const field = fieldMatch?.[1]
	const hint = field ? FIELD_HINTS[field] : undefined

	return (
		<div className="flex min-h-svh items-center justify-center bg-background p-8">
			<div className="max-w-lg space-y-4">
				<div className="flex items-center gap-3 text-destructive">
					<Warning className="size-6 shrink-0" />
					<h1 className="text-lg font-semibold">Configuration Error</h1>
				</div>
				<pre className="overflow-auto rounded-lg border bg-muted p-4 text-xs">
					{error}
				</pre>
				{hint && (
					<div className="space-y-2 rounded-lg border p-4">
						<p className="text-sm text-muted-foreground">{hint.description}</p>
						<p className="text-sm">
							Valid values:{" "}
							{hint.values.map((v, i) => (
								<span key={v}>
									{i > 0 && ", "}
									<code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
										{v}
									</code>
								</span>
							))}
						</p>
					</div>
				)}
				<p className="text-xs text-muted-foreground">
					Fix your <code className="rounded bg-muted px-1 py-0.5 font-medium">petit.config.json</code> and the page will reload automatically.
				</p>
			</div>
		</div>
	)
}

export { ConfigError, FIELD_HINTS }
