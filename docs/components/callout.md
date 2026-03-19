---
title: Callout
description: Styled alert blocks for notes, warnings, and tips
order: 9
updated: 2026-03-17
---

Highlight important information with colored callout blocks.
Use blockquote syntax with a type prefix.

## Usage

Start a blockquote with `[!TYPE]` where TYPE is one of: NOTE,
TIP, INFO, WARNING, or DANGER.

```markdown
> [!NOTE]
> This is a note with additional context.

> [!WARNING]
> Be careful with this operation.
```

## Examples

> [!NOTE]
> Notes are useful for supplementary information that helps
> the reader understand a concept better.

> [!TIP]
> Tips suggest a better way to accomplish something.

> [!INFO]
> Info blocks provide neutral background context.

> [!WARNING]
> Warnings alert the reader about potential issues.

> [!DANGER]
> Danger blocks flag actions that could cause problems.

## API reference

```type-table
# Callout types
NOTE | Blue | Supplementary information
TIP | Green | Helpful suggestions
INFO | Blue | Neutral context
WARNING | Amber | Potential issues
DANGER | Red | Destructive or risky actions
```
