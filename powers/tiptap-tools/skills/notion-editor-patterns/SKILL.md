---
name: notion-editor-patterns
description: Guidelines and UI patterns for Notion-style block editors, floating bubble menus, and slash command dropdowns.
---
# Notion-Style Rich Text Editor Patterns (TipTap & React)

This skill provides best practices for engineering modern, distraction-free block editors inspired by Notion.

## 1. Visual Hierarchy & Floating Toolbars
- **Distraction-Free Canvas**: The editing canvas should look like a plain document. Toolbars must remain hidden until text selection or block hover occurs.
- **BubbleMenu Positioning**: 
  - Render floating toolbars into a React Portal attached to `document.body` to avoid overflow clipping and stacking-context bugs.
  - Implement a collision buffer so floating menus flip above or below based on viewport boundaries.
- **Visual Feedback**: Apply subtle transitions (`framer-motion` or CSS `ease-out`) with slight opacity and translate shifts on hover badges.

## 2. React NodeView Architecture
- **State Isolation**: When rendering rich blocks (e.g. math formulas, code editors, callouts), encapsulate logic inside custom React components using `ReactNodeViewRenderer`.
- **NodeViewWrapper**: Always keep the outermost wrapper clean and style-agnostic so ProseMirror can manage DOM cursor positions accurately.
- **Zero-Flicker Updates**: Prevent unneeded re-renders by wrapping complex node viewers in `React.memo` and checking `prevProps.node.attrs === nextProps.node.attrs`.

## 3. Slash Commands (`/`) Pattern
- Configure a suggestion plugin listening to the `/` trigger.
- Keep the dropdown menu keyboard-navigable (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- Group commands semantically: Basic blocks (Headings, Lists), Media (Image, Video), and Advanced (Math block, Table, Code block).

## 4. KaTeX Math Block Invariants
- Enforce strict delimiter handling (`$\(` for block math, `\)` for inline math).
- Always wrap `katex.renderToString()` in a try/catch block to display graceful error states in the NodeView rather than crashing the editor state.