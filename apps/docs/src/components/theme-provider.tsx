import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

/** Supported theme values */
export type Theme = "light" | "dark" | "system"

/** Theme context value shape */
interface ThemeContextValue {
	/** Current theme setting (may be "system") */
	theme: Theme
	/** Set the theme */
	setTheme: (theme: Theme) => void
	/** Resolved theme after evaluating "system" preference */
	resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = "petit-theme"

/** Resolves the "system" theme to light or dark based on media query */
function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light"
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** Props for the ThemeProvider component */
interface ThemeProviderProps {
	children: React.ReactNode
	defaultScheme?: Theme
}

/** Provides theme state to the component tree and syncs with localStorage and the html element */
function ThemeProvider({ children, defaultScheme = "system" }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return defaultScheme
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored === "light" || stored === "dark" || stored === "system") return stored
		return defaultScheme
	})

	const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme)

	const resolvedTheme = theme === "system" ? systemTheme : theme

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next)
		localStorage.setItem(STORAGE_KEY, next)
	}, [])

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)")
		const handler = (e: MediaQueryListEvent) => {
			setSystemTheme(e.matches ? "dark" : "light")
		}
		mq.addEventListener("change", handler)
		return () => mq.removeEventListener("change", handler)
	}, [])

	useEffect(() => {
		const root = document.documentElement
		root.classList.toggle("dark", resolvedTheme === "dark")
	}, [resolvedTheme])

	const value = useMemo(
		() => ({ theme, setTheme, resolvedTheme }),
		[theme, setTheme, resolvedTheme],
	)

	return <ThemeContext value={value}>{children}</ThemeContext>
}

/** Access the current theme context */
function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext)
	if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
	return ctx
}

export { ThemeProvider, useTheme }
