# Implementation Plan: Rich Text Editor Refactor

## Overview

Refactor the monolithic rich text editor (2500 lines) into a modular, feature-based architecture with modernized floating UIs, shared toolbar primitives, and 100% serialization fidelity. This plan breaks the refactor into 11 discrete, incremental tasks using TypeScript/React that build on each other, starting with shared infrastructure and progressing through feature domains to integration.

---

## Tasks

- [-] 1. Set up extension module structure and shared types
  - Create directory structure: `extensions/shared/`, `extensions/media/`, `extensions/math/`, `extensions/code/`, `extensions/table/`
  - Create `types/editor.ts` with core type definitions (node schemas, attribute specs)
  - Set up `extensions/index.ts` barrel export
  - Verify TypeScript compilation with `strict: true`
  - _Requirements: 1.1, 1.2, 12.1, 12.4_

- [ ] 2. Implement shared toolbar component library
  - [~] 2.1 Create `Toolbar_Button`, `ToolbarSeparator`, `ToolbarGroup`, `ToolbarSelect` components
    - Implement with HSL token-only theming (no hardcoded colors)
    - Add `isActive` state styling (`bg-foreground text-background`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.8, 14.1, 14.3_
  
  - [~] 2.2 Create `FloatingPanel`, `PreviewBox`, `StatusBadge` components
    - `FloatingPanel`: fixed positioning, z-index 999999, 1px border, 8px padding
    - `PreviewBox`: min-height 48px, centered, overflow-x auto
    - `StatusBadge`: supports 'unsaved', 'saving', 'saved' states with appropriate tokens
    - _Requirements: 2.5, 2.6, 2.7, 8.2, 14.1_

  - [ ]* 2.3 Write property test for Toolbar_Button active state styling
    - **Property 7: Toolbar Button Active State Styling Is Applied Consistently**
    - **Validates: Requirement 2.8**

  - [~] 2.4 Export all toolbar components from `extensions/shared/toolbar/index.ts`
    - _Requirements: 2.9_

- [ ] 3. Implement media extensions (Image, Video, Audio, Coordinates)
  - [~] 3.1 Create separate `ImageExtension.tsx`, `VideoExtension.tsx`, `AudioExtension.tsx`, `CoordinatesExtension.tsx`
    - Extract from `RichTextExtensions.tsx`
    - Implement parseHTML/renderHTML for round-trip fidelity
    - _Requirements: 3.1, 11.1, 11.6_

  - [~] 3.2 Create media NodeViews with floating action rows
    - Create `ImageNodeView.tsx`, `VideoNodeView.tsx`, `AudioNodeView.tsx`, `CoordinatesNodeView.tsx`
    - Implement hover transitions (150ms opacity fade)
    - Add delete button in floating action row
    - _Requirements: 3.2, 3.3_

  - [~] 3.3 Implement alt text editor for image and video
    - Create inline form anchored to ALT badge
    - Handle Enter to submit, Escape to dismiss
    - Call `updateAttributes({ alt: value.trim() })`
    - _Requirements: 3.4, 3.5_

  - [ ]* 3.4 Write property test for alt badge styling
    - **Property 3: Alt Badge Styling Reflects Alt Text Content State**
    - **Validates: Requirement 3.6**

  - [~] 3.5 Implement alt text language resolution with priority fallback
    - Create `useMediaAttributes` hook
    - Resolve: active lang → default lang → first non-empty → empty string
    - _Requirements: 3.7_

  - [~] 3.6 Implement BrokenMediaWarning placeholder for invalid src
    - Render placeholder when src is absent, empty, or lacks valid URI scheme
    - Keep delete button enabled in action row
    - _Requirements: 3.8_

  - [ ]* 3.7 Write property test for broken media rendering
    - **Property 8: Broken Media Nodes Render Warning Placeholder**
    - **Validates: Requirement 3.8**

  - [~] 3.8 Export all media extensions from `extensions/media/index.ts`
    - _Requirements: 3.9_

- [ ] 4. Implement math extensions (MathFormula, InlineMath)
  - [~] 4.1 Create `MathFormulaExtension.tsx` and `InlineMathExtension.tsx`
    - Extract from `RichTextExtensions.tsx`
    - Implement parseHTML/renderHTML with data-type and data-latex attributes
    - _Requirements: 4.10, 11.1, 11.2_

  - [~] 4.2 Create `mathSymbols.ts` with symbol data
    - Export `MATH_CATEGORIES` for block math, `INLINE_*_SYMBOLS` for inline
    - _Requirements: 4.2_

  - [~] 4.3 Create `useMathPreview` hook in `extensions/shared/`
    - Accept `latex: string, displayMode: boolean`
    - Return `{ previewHtml: string, hasError: boolean, errorMessage: string }` using KaTeX
    - _Requirements: 4.3_

  - [~] 4.4 Create `MathFormulaNodeView.tsx` with floating editor
    - Open editor immediately on creation, cursor in LaTeX input
    - Use portal-based fixed positioning with position recalc on scroll/resize
    - Debounce preview update to 150ms
    - _Requirements: 4.1, 4.4, 4.5, 4.12_

  - [ ]* 4.5 Write property test for math preview update responsiveness
    - **Property 4: Math Preview Updates Respond to LaTeX Input Changes**
    - **Validates: Requirement 4.5**

  - [~] 4.6 Implement math editor keyboard handling (Cmd+Enter, Escape)
    - Cmd+Enter: update node latex and close
    - Escape with empty latex: delete node
    - Escape with non-empty latex: close without modifying
    - _Requirements: 4.7, 4.8, 4.9_

  - [~] 4.7 Create `MathSymbolPalette.tsx` component
    - Accept categories, activeCategory, onCategoryChange, onInsert
    - Render categorized grid of LaTeX symbol shortcuts
    - _Requirements: 4.13_

  - [~] 4.8 Create `InlineMathNodeView.tsx` with inline editor
    - Render as inline span, open editor on selection
    - Reuse keyboard handling and symbol palette
    - _Requirements: 4.1, 4.4_

  - [ ]* 4.9 Write property test for serialization round-trip with math nodes
    - **Property 1: Serialization Round-Trip Preserves All Node Data (math subset)**
    - **Validates: Requirements 4.11, 11.6_

  - [~] 4.10 Export all math extensions from `extensions/math/index.ts`
    - _Requirements: 4.1_

- [ ] 5. Implement code block extension with enhanced toolbar
  - [~] 5.1 Create `CodeBlockExtension.tsx` and `CodeBlockNodeView.tsx`
    - Extract from `RichTextExtensions.tsx`
    - Implement parseHTML/renderHTML with data-language and data-wrap attributes
    - _Requirements: 5.1, 11.5_

  - [~] 5.2 Create `languageSupport.ts` with supported languages
    - Export `SUPPORTED_CODE_LANGUAGES: { id: string; label: string }[]`
    - Include all languages from current implementation
    - _Requirements: 5.2_

  - [~] 5.3 Create `CodeBlockToolbar.tsx` component
    - Render in order: window dots, language select, wrap toggle, copy, delete buttons
    - Accept props: language, wrapLines, onLanguageChange, onWrapToggle, onCopy, onDelete, copied
    - _Requirements: 5.3, 5.8_

  - [~] 5.4 Implement code block toolbar interaction
    - Language select: call `updateAttributes({ language: value })` and update label in one render cycle
    - Wrap toggle: apply `whitespace-pre-wrap break-words` when active, `whitespace-pre overflow-x-auto` when inactive
    - Copy: write node.textContent to clipboard, show confirmation icon for 2000ms
    - _Requirements: 5.4, 5.6, 5.7_

  - [ ]* 5.5 Write property test for code language persistence
    - **Property 10: Code Block Language Selection Persists and Serializes**
    - **Validates: Requirement 5.4, 5.7**

  - [~] 5.6 Export code extension from `extensions/code/index.ts`
    - _Requirements: 5.1_

- [ ] 6. Implement table extensions with selection styling
  - [~] 6.1 Create `TableExtension.tsx`, `TableRowExtension.tsx`, `TableHeaderExtension.tsx`, `TableCellExtension.tsx`
    - Extract from `RichTextExtensions.tsx`
    - Each independently instantiable without importing others
    - Implement parseHTML/renderHTML for round-trip fidelity
    - _Requirements: 6.1, 11.6_

  - [~] 6.2 Implement table cell selection styling
    - Apply visible background tint to selected cells
    - Apply color accent to column resize handles
    - Render `<th>` with distinct background, `<td>` with top-aligned content
    - _Requirements: 6.2, 6.3_

  - [~] 6.3 Create table-action bar and keyboard handling
    - Display contextual bar when cursor is inside any table cell
    - Controls: add row above/below, delete row, add column before/after, delete column, toggle header, delete table
    - Dismiss when cursor moves outside table
    - _Requirements: 6.4, 6.5_

  - [~] 6.4 Export table extensions from `extensions/table/index.ts`
    - _Requirements: 6.1_

- [ ] 7. Implement floating selection toolbar in inline editor
  - [~] 7.1 Create `useFloatingToolbar` hook
    - Track text selection bounding rect
    - Calculate position: bottom 8px above selection top, horizontally centered, within viewport
    - Reposition on selectionchange event
    - _Requirements: 7.1, 7.5_

  - [~] 7.2 Create floating toolbar component with three button groups
    - Group 1 (text style): bold, italic, underline, strikethrough, highlight
    - Group 2 (headings): H1, H2, H3
    - Group 3 (inserts): link, inline math
    - _Requirements: 7.2_

  - [~] 7.3 Implement floating toolbar show/hide and positioning logic
    - Show on non-empty selection, dismiss on selection collapse
    - Dismiss on click outside editor with 100ms fade-out
    - Reposition above selection, or below if top is within 60px of viewport top
    - _Requirements: 7.1, 7.3, 7.4, 7.8_

  - [ ]* 7.4 Write property test for muted mode UI suppression
    - **Property 9: Muted Mode Prevents UI Rendering Based on Editor State**
    - **Validates: Requirement 7.6**

  - [~] 7.5 Implement floating toolbar integration with RichTextFieldRenderer
    - Integrate into main editor, ensure both fixed and floating toolbars visible
    - Button click keeps toolbar visible until formatting applied
    - _Requirements: 7.7, 7.9_

- [ ] 8. Implement FullScreenEditor header and state management
  - [~] 8.1 Create `useEditorState` hook
    - Calculate word count (0 for empty/whitespace, token count for non-empty)
    - Calculate reading time: `Math.max(1, Math.ceil(wordCount / 200))`
    - Track unsaved/saving/saved status
    - _Requirements: 10.1, 10.3, 10.4_

  - [ ]* 8.2 Write property test for word count consistency
    - **Property 5: Word Count Calculation Is Consistent Across Text Variations**
    - **Validates: Requirement 10.3**

  - [ ]* 8.3 Write property test for reading time minimum of 1
    - **Property 6: Reading Time Calculation Returns Minimum 1 Minute**
    - **Validates: Requirement 10.4**

  - [~] 8.4 Create `EditorHeader.tsx` component
    - Render field label, StatusBadge, page-width control (A4/Wide/Full), import/export/close buttons
    - Apply backdrop-blur-md when scroll > 0px
    - Show co-editor count badge
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [~] 8.5 Create `useEditorKeyboard` hook
    - Handle Escape (close), ⇧⌘F (toggle fullscreen), Cmd+B/Cmd+I (passthrough)
    - Register on window with capture: true, cleanup on unmount
    - _Requirements: 10.2, 10.5_

  - [~] 8.6 Create `EditorCanvas.tsx` component with desk/paper rendering
    - Render muted desk background with elevated paper sheet
    - Constrain paper width: 850px (A4), 1150px (Wide), none (Full)
    - Animate width transitions over 300ms
    - Display file drop overlay when drag-active
    - Apply typographic scale (H1/H2/H3 sizing and weight)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [~] 8.7 Integrate FullScreenEditor with header, canvas, and state hooks
    - Wire up status updates, keyboard shortcuts, page-width changes
    - _Requirements: 8.1, 10.1, 10.2_

- [ ] 9. Implement i18n key coverage across refactored components
  - [~] 9.1 Add all new UI strings to `src/locales/en.json` with i18n keys
    - Toolbar labels, button titles, placeholder text, ARIA labels, toast messages
    - Example keys: `editor:toolbar.bold`, `editor:alt-editor.title`, `editor:code.copy`, etc.
    - _Requirements: 13.1, 13.2_

  - [~] 9.2 Wrap all UI strings in refactored components with `t(key, fallback)`
    - Use `useTranslation` hook from `react-i18next`
    - Verify no untranslated strings render
    - _Requirements: 13.1, 13.3, 13.4_

- [ ] 10. Implement dark mode CSS variable theming
  - [~] 10.1 Audit refactored components for hardcoded colors
    - Replace all hardcoded hex, RGB, HSL with HSL token classes only
    - Verify no Tailwind palette utilities (bg-white, text-black, bg-gray-*, etc.)
    - _Requirements: 14.1, 14.3_

  - [~] 10.2 Add dark class to FullScreenEditor root div
    - Apply/remove dark class based on ThemeContext value
    - Update within one render cycle on theme toggle
    - _Requirements: 14.2, 14.4_

- [ ] 11. Checkpoint — validate serialization round-trip and full integration
  - [~] 11.1 Test round-trip serialization for all custom node types
    - Load current editor HTML into refactored editor
    - Verify `getHTML()` produces equivalent HTML (whitespace normalization acceptable)
    - Ensure all data-* attributes match original
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 11.2 Write property test for complete serialization round-trip
    - **Property 1: Serialization Round-Trip Preserves All Node Data (full)**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

  - [~] 11.3 Verify all 14 requirements satisfied
    - Run TypeScript compiler with strict: true
    - Verify zero TypeScript errors
    - Verify no hardcoded colors in refactored code
    - _Requirements: 12.4, 14.1, 14.3_

  - [~] 11.4 Verify `normalizeMathInHtml` export preserved
    - Check export exists in `RichTextFieldRenderer`
    - Verify markdown import and paste handling still work
    - _Requirements: 11.7_

  - [~] 11.5 Final integration test
    - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional property-based test tasks and can be skipped for faster MVP, but are recommended for ensuring correctness properties hold.
- Each task references specific requirements for traceability and acceptance.
- Property tests use `vitest` with `fast-check` library for 100+ iterations each.
- All new components use HSL token variables only (no hardcoded colors).
- Checkpoints (tasks 11.x) ensure incremental validation of key properties before final integration.
- Task dependencies respect module organization: shared infrastructure first, then feature domains, then integration.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.0"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5", "3.6", "4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["3.7", "3.8", "4.4", "4.5", "4.6", "4.7", "5.1", "5.2"] },
    { "id": 5, "tasks": ["4.8", "4.9", "4.10", "5.3", "5.4", "5.5", "6.1"] },
    { "id": 6, "tasks": ["5.6", "6.2", "6.3", "6.4", "7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3", "7.4", "7.5", "8.1", "8.2", "8.3"] },
    { "id": 8, "tasks": ["8.4", "8.5", "8.6"] },
    { "id": 9, "tasks": ["8.7", "9.1"] },
    { "id": 10, "tasks": ["9.2", "10.1", "10.2"] },
    { "id": 11, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5"] }
  ]
}
```
