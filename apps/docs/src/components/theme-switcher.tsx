import { Sun, Moon } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/components/theme-provider"

/** Button that toggles between light and dark themes */
function ThemeSwitcher() {
	const { resolvedTheme, setTheme } = useTheme()
	const Icon = resolvedTheme === "dark" ? Moon : Sun

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			aria-label={`Switch theme (current: ${resolvedTheme})`}
		>
			<Icon className="size-4" />
		</Button>
	)
}

export { ThemeSwitcher }
