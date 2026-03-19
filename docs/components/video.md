---
title: Video
description: Embedded YouTube and Vimeo videos
order: 10
updated: 2026-03-17
---

Embed videos from YouTube or Vimeo with a simple code fence.
Videos render as responsive iframes with lazy loading and
privacy-enhanced mode.

## Usage

Use the `youtube` or `vimeo` code fence with the video ID as
content:

````markdown
```youtube
dQw4w9WgXcQ
```
````

````markdown
```vimeo
123456789
```
````

The video ID is the part after `watch?v=` for YouTube or
after `vimeo.com/` for Vimeo.

## Examples

### YouTube

```youtube
dQw4w9WgXcQ
```

### Vimeo

```vimeo
76979871
```

## API reference

```type-table
# Video properties
platform | "youtube" \| "vimeo" | required | Code fence language determines the platform
id | string | required | Video ID (content of the code fence)
```
