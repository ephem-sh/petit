---
title: Themes
description: Built-in theme presets and customization
order: 5
---

Petit ships with 18 built-in themes. Set the `theme` option in
your `petit.config.json`:

```json
{
  "theme": "claude"
}
```

## Available themes

Click a theme name to preview its colors on this page. Code
block highlighting uses the configured theme and doesn't
change in the preview.

```theme-preview
```

| Theme | Description |
|-------|-------------|
| `default` | Neutral grayscale |
| `2077` | Cyberpunk neon aesthetic |
| `amber` | Warm amber monospace |
| `burgundy` | Rich burgundy and cream |
| `claude` | Warm earthy tones |
| `deep` | Deep blue and purple |
| `ghibli` | Soft pastel palette |
| `itadori` | Vibrant anime-inspired |
| `offworld` | Cold futuristic grays |
| `pine` | Soft muted greens |
| `starbucks` | Green and cream |
| `stella` | Purple and lavender |
| `supabase` | Green developer brand |
| `supra` | Bold and high contrast |
| `t3chat` | Clean modern neutral |
| `vercel` | Pure black and white |
| `void` | Ultra dark minimal |
| `zen` | Calm and balanced |

## Custom fonts

Override the default fonts with any Google Font:

```json
{
  "fonts": {
    "sans": "Inter",
    "mono": "Fira Code"
  }
}
```

Petit loads the fonts from Google Fonts automatically and adds
system font fallbacks.

## CSS variable overrides

Fine-tune colors per scheme using `themeOverrides`:

```json
{
  "theme": "claude",
  "themeOverrides": {
    "dark": {
      "custom": {
        "primary": "oklch(0.7 0.2 200)"
      }
    }
  }
}
```

Each theme defines colors as CSS custom properties using oklch
values. You can override any variable individually without
replacing the entire theme.
