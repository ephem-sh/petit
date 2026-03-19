---
title: Diagram
description: Mermaid diagrams rendered client-side
order: 4
updated: 2026-03-16
---

# Diagram

Render diagrams using Mermaid.js syntax. Diagrams are rendered client-side.

## Usage

Use the `mermaid` code fence with Mermaid syntax.

````markdown
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
```
````

## Example

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
```

## API Reference

```type-table
# Diagram Properties
syntax | string | required | Valid Mermaid.js diagram syntax
```
