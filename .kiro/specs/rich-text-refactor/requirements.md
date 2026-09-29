# Requirements Document

## Introduction

The rich text editor for the Nomad CMS currently consists of two monolithic files — `RichTextExtensions.tsx` (~1200 lines) and `RichTextFieldRenderer.tsx` (~1300 lines) — that bundle all Tiptap extension logic, ProseMirror schemas, React NodeViews, toolbar state, and fullscreen UI into single flat modules. This makes isolated testing difficult, increases merge conflict risk, and impedes iterative UI improvements.

This feature refactors the editor into a feature-based module structure (media, math, code, table, shared) and delivers a modern, minimalist editing UI with floating context-aware toolbars, portal-based popover editors, and a cleaner fullscreen document workspace — all while preserving 100% of existing serialization fidelity and editor behavior.

---

## Glossary

- **Editor**: The Tiptap-based rich text editing component rendered inside `RichTextFieldRenderer`.
- **FullScreenEditor**: The fullscreen overlay document workspace rendered via a React portal when the user activates "Docs mode" (⇧⌘F).
- **Extension**: A single Tiptap `Node.create` or `Mark.create` unit that defines a ProseMirror schema, HTML serialization rules, and optional commands.
- **NodeView**: A React component rendered by Tiptap's `ReactNodeViewRenderer` that replaces the browser's default DOM rendering for an Extension's node.
- **FloatingToolbar**: A transient toolbar UI element that appears contextually on text selection or node hover, positioned via a React portal.
- **SymbolPalette**: The categorized grid of LaTeX symbol shortcuts rendered inside math editor popovers.
- **SerializedHTML**: The HTML string produced by `editor.getHTML()`, stored and re-hydrated as editor content.
- **KaTeX**: The LaTeX-to-HTML renderer used for math formula preview and static rendering.
- **Portal**: A React `createPortal` call that renders UI into `document.body`, used to escape stacking context and overflow-hidden containers.
- **i18n_Key**: A string identifier passed to the `t(key, fallback)` helper from `react-i18next`. All UI strings must use i18n keys.
- **HSL_Theme**: The CSS variable-based design token system (`--background`, `--foreground`, `--primary`, `--border`, etc.) supporting light and dark modes.
- **Toolbar_Button**: A reusable icon button component used inside toolbars and floating menus.
- **Media_Extension**: Any of the four media-type Tiptap extensions: CustomImage, Video, Audio, Coordinates.
- **Math_Extension**: Either of the two math Tiptap extensions: MathFormula (block) or InlineMath (inline).
- **Code_Extension**: The CustomCodeBlock Tiptap extension.
- **Table_Extension**: The set of four table Tiptap extensions: CustomTable, CustomTableRow, CustomTableHeader, CustomTableCell.

---

## Requirements

---

### Requirement 1: Feature-Based Extension Module Structure

**User Story:** As a developer, I want extension code organized by feature domain, so that I can locate, modify, and test each extension in isolation without navigating a 1200-line file.

#### Acceptance Criteria

1. THE Editor SHALL organize all Tiptap extensions under `src/components/fields/FieldRendererComponents/extensions/` with subdirectories `media/`, `math/`, `code/`, `table/`, and `shared/`, with each subdirectory containing only files related to its named feature domain.
2. THE Editor SHALL export all extensions through a single barrel file at `extensions/index.ts` so that `RichTextFieldRenderer` can import the full extension set from one import statement.
3. WHEN a developer imports from `extensions/index.ts`, THE Editor SHALL resolve to the following eleven custom Tiptap extensions currently registered in `RichTextFieldRenderer.useEditor`: `CustomImage`, `Video`, `Audio`, `Coordinates`, `MathFormula`, `InlineMath`, `CustomCodeBlock`, `CustomTable`, `CustomTableRow`, `CustomTableHeader`, `CustomTableCell`.
4. THE Editor SHALL place each Extension's Tiptap `Node.create` definition and its companion React NodeView in separate files within the same feature subdirectory (e.g., `ImageExtension.tsx` and `ImageNodeView.tsx`).
5. THE Editor SHALL provide `useMathPreview`, `useMediaAttributes`, and `useFloatingToolbar` hooks, extracted or created new, in `extensions/shared/` so that multiple NodeView components can consume them without duplicating logic.
6. IF any single file under `extensions/` grows beyond 300 lines, THEN that file SHALL be split into focused sub-modules before the task containing it is considered complete.
7. THE Editor SHALL remove the monolithic `RichTextExtensions.tsx` file once all eleven extensions have been successfully migrated to their respective feature subdirectories.

---

### Requirement 2: Shared Toolbar Component Library

**User Story:** As a developer, I want a consistent set of primitive toolbar UI components, so that all toolbars and floating menus across the editor use a unified visual language without copy-pasting styles.

#### Acceptance Criteria

1. THE Editor SHALL provide a `Toolbar_Button` component that accepts `icon`, `isActive`, `onClick`, `title`, and an optional `variant` prop (`'toolbar' | 'menu' | 'ghost'`), where `'toolbar'` applies a bordered background on hover, `'menu'` applies full-width block layout, and `'ghost'` applies no border or background, rendering consistently across all toolbar surfaces.
2. THE Editor SHALL provide a `ToolbarSeparator` component that renders a `1px` vertical divider using the `--border` HSL token.
3. THE Editor SHALL provide a `ToolbarGroup` component that wraps a set of `Toolbar_Button` elements with consistent `gap-1` spacing and optional `label` text rendered above the group at a maximum of 32 characters.
4. THE Editor SHALL provide a `ToolbarSelect` component for dropdown selection (e.g., language picker) that applies `--border`, `--background`, and `--foreground` tokens and emits an `onChange` callback receiving the selected option's string value.
5. THE Editor SHALL provide a `FloatingPanel` component that wraps portal-rendered popovers with `padding: 8px`, a `1px` border using the `--border` token, `box-shadow` using the `--shadow` token, `border-radius: 6px`, and `z-index: 999999` stacking.
6. THE Editor SHALL provide a `PreviewBox` component that renders a KaTeX HTML preview region with a minimum height of `48px`, centered content via `text-align: center`, and `overflow-x: auto` as a scroll fallback.
7. THE Editor SHALL provide a `StatusBadge` component that accepts a `status` prop (`'unsaved' | 'saving' | 'saved'`) and renders a `6px` circular dot with label text, where `'unsaved'` uses the `--destructive` token, `'saving'` uses the `--muted-foreground` token, and `'saved'` uses the `--success` token.
8. IF the `isActive` prop on a `Toolbar_Button` is `true`, THEN THE Editor SHALL apply `bg-foreground text-background` styling to that button to indicate the active state.
9. THE Editor SHALL export all shared toolbar components from a single file at `extensions/shared/` so that all surfaces import from the same source.

---

### Requirement 3: Media Extensions — Modular Structure and Floating NodeView UI

**User Story:** As a content editor, I want image, video, audio, and map embeds to display an unobtrusive inline toolbar on hover, so that I can edit alt text, copy the URL, or delete the node without disrupting my writing flow.

#### Acceptance Criteria

1. THE Editor SHALL split the current `CustomImage`, `Video`, `Audio`, and `Coordinates` Tiptap definitions into separate files: `ImageExtension.tsx`, `VideoExtension.tsx`, `AudioExtension.tsx`, and `CoordinatesExtension.tsx` inside `extensions/media/`.
2. THE Editor SHALL render a React NodeView for each Media_Extension via `ReactNodeViewRenderer`, replacing the previous inline DOM approach.
3. WHEN a user's pointer enters a media node, THE Editor SHALL transition the floating action row (containing copy URL, edit alt text, and delete buttons) from opacity `0` to opacity `1` over `150ms`; WHEN the pointer leaves the media node, THE Editor SHALL transition the row back from opacity `1` to opacity `0` over `150ms`.
4. WHEN a user clicks the ALT badge on an image or video node, THE Editor SHALL open an inline alt-text edit form anchored to the badge's position, not the image center.
5. WHEN a user submits the alt-text edit form (via the Enter key or a confirm button), THE Editor SHALL call `updateAttributes({ alt: value.trim() })` and close the form; WHEN a user dismisses the form (via Escape or clicking outside), THE Editor SHALL close the form without modifying the node's `alt` attribute.
6. IF the media node's alt text attribute contains at least one non-whitespace character, THEN THE Editor SHALL render the ALT badge with `bg-emerald-500/85 text-white` styling; IF the alt text attribute is null, empty, or contains only whitespace characters, THEN THE Editor SHALL render the ALT badge with `bg-black/50 text-white mix-blend-difference` styling.
7. THE Editor SHALL resolve the display alt text for the active language by consulting the central alt dictionary in the following priority order: `activeLang` value → `defaultLang` value → first available non-empty value across all language keys → empty string if the dictionary is empty or has no non-empty values.
8. IF a media node's `src` attribute is absent, empty, or does not begin with a valid URI scheme (`http://`, `https://`, `/`, `./`, or `../`), THEN THE Editor SHALL render a `BrokenMediaWarning` placeholder in place of the media element; the floating action row SHALL still appear on hover of the placeholder with only the delete button enabled.
9. THE Editor SHALL export all Media_Extension instances from `extensions/media/index.ts`.
10. WHEN a media node is serialized, THE Editor SHALL produce HTML attributes (`src`, `alt`, `data-type`, `data-lat`, `data-lng`) with values that are equivalent to those produced by the current implementation for the same input data.

---

### Requirement 4: Math Extensions — Modernized Floating Editor

**User Story:** As a content editor, I want a floating LaTeX editor with live preview and symbol shortcuts, so that I can compose block and inline math formulas without leaving my writing context.

#### Acceptance Criteria

1. THE Editor SHALL split `MathFormula` and `InlineMath` into separate files in `extensions/math/`: `MathFormulaExtension.tsx`, `MathFormulaNodeView.tsx`, `InlineMathExtension.tsx`, `InlineMathNodeView.tsx`.
2. THE Editor SHALL extract the LaTeX symbol data into `extensions/math/mathSymbols.ts` as a typed constant exported as `MATH_CATEGORIES` (for block math) and `INLINE_GREEK_SYMBOLS`, `INLINE_FORMAT_SYMBOLS`, `INLINE_OPERATOR_SYMBOLS` (for inline math).
3. THE Editor SHALL provide a `useMathPreview` hook in `extensions/shared/` that accepts `latex: string` and `displayMode: boolean` and returns `{ previewHtml: string, hasError: boolean, errorMessage: string }` using KaTeX.
4. WHEN a user creates a new `MathFormula` node, THE Editor SHALL open the floating editor immediately with the cursor placed in the LaTeX input field.
5. WHEN a user types in the LaTeX input of a math editor, THE Editor SHALL update the live KaTeX preview within `150ms` of the last keystroke.
6. WHEN KaTeX encounters a parse error, THE Editor SHALL display the error message in a warning box below the preview without preventing the user from saving the formula.
7. WHEN a user presses `Ctrl+Enter` (or `Cmd+Enter`) inside the math editor, THE Editor SHALL update the node's `latex` attribute to the current input value and close the editor.
8. WHEN a user presses `Escape` inside the math editor and the node's `latex` attribute is null, empty, or contains only whitespace, THE Editor SHALL delete the node from the document.
9. WHEN a user presses `Escape` inside the math editor and the node's `latex` attribute contains at least one non-whitespace character, THE Editor SHALL close the editor without modifying the node's `latex` attribute.
10. THE Editor SHALL render the `MathFormula` display-mode node as a block-level `div[data-type="math-formula"]` and the `InlineMath` node as an `inline span[data-type="inline-math"]` in the serialized HTML.
11. WHEN the editor serializes a document containing a math node with a non-empty `latex` attribute and then parses that serialized HTML back into a new editor instance, THE Editor SHALL produce the same serialized HTML when `getHTML()` is called on the new instance.
12. WHEN the math editor popover is rendered, THE Editor SHALL use portal-based fixed positioning and recalculate the popover position coordinates whenever a `scroll` or `resize` event fires on the window.
13. THE Editor SHALL extract the `SymbolPalette` UI into a standalone `MathSymbolPalette.tsx` component in `extensions/math/` that accepts `categories`, `activeCategory`, `onCategoryChange`, and `onInsert` props.

---

### Requirement 5: Code Block Extension — Enhanced Toolbar Chrome

**User Story:** As a content editor, I want a styled code block with a visible toolbar showing the current language and copy controls, so that code snippets are clearly distinguished and easy to interact with.

#### Acceptance Criteria

1. THE Editor SHALL extract the code block Tiptap definition into `extensions/code/CodeBlockExtension.tsx` and its NodeView into `extensions/code/CodeBlockNodeView.tsx`.
2. THE Editor SHALL extract the language list into `extensions/code/languageSupport.ts` as `SUPPORTED_CODE_LANGUAGES: { id: string; label: string }[]`, where each entry's `id` is a non-empty string and `label` is a human-readable display name, covering at least the languages present in the current implementation.
3. THE Editor SHALL render a toolbar row at the top of each code block NodeView when it is displayed, containing exactly these seven elements in left-to-right order: three macOS-style window-dot spans, a language `ToolbarSelect`, a line-wrap toggle `Toolbar_Button`, a copy `Toolbar_Button`, and a delete `Toolbar_Button`.
4. WHEN a user changes the language via the `ToolbarSelect`, THE Editor SHALL call `updateAttributes({ language: value })` and update the language label displayed in the `ToolbarSelect` to reflect the newly selected language within one render cycle.
5. WHEN a user clicks the copy button and the clipboard write succeeds, THE Editor SHALL write `node.textContent` to the clipboard and display a confirmation icon with a green tint for `2000ms` before reverting to the copy icon; IF the clipboard write fails, THE Editor SHALL display an error icon for `2000ms` before reverting to the copy icon.
6. WHEN the line-wrap toggle is activated, THE Editor SHALL apply `whitespace-pre-wrap break-words` to the `<pre>` element; WHEN the line-wrap toggle is deactivated, THE Editor SHALL apply `whitespace-pre overflow-x-auto` to the `<pre>` element; on initial render without a persisted wrap state, THE Editor SHALL apply the inactive (no-wrap) styles.
7. THE Editor SHALL serialize the code block as `<pre data-language="{lang}" data-wrap="{bool}" class="nomad-code-block ..."><code class="language-{lang}">...</code></pre>` where `{lang}` matches the `id` field of the selected entry in `SUPPORTED_CODE_LANGUAGES` and `{bool}` is the string `"true"` or `"false"`.
8. THE Editor SHALL extract the toolbar chrome into `extensions/code/CodeBlockToolbar.tsx` as a component that accepts `language: string`, `wrapLines: boolean`, `onLanguageChange: (lang: string) => void`, `onWrapToggle: () => void`, `onCopy: () => void`, `onDelete: () => void`, and `copied: boolean` props.

---

### Requirement 6: Table Extensions — Modular Structure and Selection Styling

**User Story:** As a content editor, I want table cells and headers to visually indicate selection and cursor position, so that I can navigate and edit table content with confidence.

#### Acceptance Criteria

1. THE Editor SHALL register `TableExtension`, `TableRowExtension`, `TableHeaderExtension`, and `TableCellExtension` as four independently instantiable Tiptap extensions that can each be imported separately without importing the others.
2. WHEN a table cell is selected in the editor, THE Editor SHALL apply a visible background tint to that cell to indicate selection; WHEN a column resize handle is active, THE Editor SHALL apply a color accent to the resize handle to distinguish it from inactive handles.
3. THE Editor SHALL render `<th>` elements with a background color that is visually distinct from the desk/page background, and `<td>` elements with vertically top-aligned content.
4. WHILE the cursor is positioned inside any cell of a table, THE Editor SHALL display a contextual table-action bar containing controls for: add row above, add row below, delete row, add column before, add column after, delete column, toggle header row, and delete table; each control SHALL execute its named operation when activated.
5. WHEN the cursor moves outside all cells of a table, THE Editor SHALL dismiss the contextual table-action bar.
6. WHEN a table node is serialized, THE Editor SHALL produce `<table>` HTML with `class`, `border`, and `cellpadding` attributes whose values are identical to those produced by the current `CustomTable.renderHTML` implementation for the same table node data.

---

### Requirement 7: Inline RichTextFieldRenderer — Floating Selection Toolbar

**User Story:** As a content editor, I want a floating toolbar to appear over my text selection inside the inline editor, so that I can apply formatting without reaching for a fixed toolbar row.

#### Acceptance Criteria

1. WHEN a user selects text in the Editor and the selection is not empty, THE Editor SHALL display a `FloatingToolbar` portal positioned so that its bottom edge is at most `8px` above the top of the selection bounding rect, horizontally centered over the selection, and fully contained within the viewport bounds.
2. THE FloatingToolbar SHALL contain icon-only `Toolbar_Button` elements arranged in three visually separated groups in order: text style group (bold, italic, underline, strikethrough, highlight), headings group (H1, H2, H3), and inserts group (link, inline math).
3. WHEN the user collapses the selection, THE FloatingToolbar SHALL dismiss with a fade-out opacity transition of `100ms`.
4. WHEN the user clicks outside the editor while a selection is active, THE FloatingToolbar SHALL dismiss with a fade-out opacity transition of `100ms`.
5. WHILE the FloatingToolbar is displayed, THE FloatingToolbar SHALL update its position on every `selectionchange` event to track the current selection's bounding rect.
6. IF the Editor is in a disabled or read-only state, THEN THE FloatingToolbar SHALL not render regardless of selection state.
7. WHEN a user clicks a formatting button in the FloatingToolbar, THE FloatingToolbar SHALL remain visible until the formatting command has been applied, then dismiss only if the resulting selection is empty.
8. WHEN the selection bounding rect top is within `60px` of the viewport top edge, THE FloatingToolbar SHALL reposition below the selection instead of above it.
9. WHEN a non-empty text selection exists and the FloatingToolbar is visible, THE fixed toolbar row SHALL also remain visible; both toolbars SHALL be simultaneously accessible.

---

### Requirement 8: FullScreenEditor — Modernized Header and Navigation

**User Story:** As a content editor, I want the fullscreen editor header to show a clear document title, save status, and action controls without visual noise, so that I can focus on writing.

#### Acceptance Criteria

1. THE FullScreenEditor SHALL extract its header into a standalone `EditorHeader.tsx` component inside `editor/components/` that accepts `fieldLabel`, `status`, `pageWidth`, `onPageWidthChange`, `onImport`, `onExport`, and `onClose` as props.
2. THE EditorHeader SHALL render a `StatusBadge` component reflecting one of three states: `'unsaved'` (amber/destructive dot), `'saving'` (pulsing muted dot), or `'saved'` (success dot); the badge SHALL update to reflect the status value passed via the `status` prop on each render.
3. IF the user has not made any edits to the document since the last successful save, THEN THE EditorHeader SHALL pass `'saved'` as the `status` value to the `StatusBadge`.
4. WHEN the user makes any edit to the document content, THE EditorHeader SHALL pass `'unsaved'` as the `status` value within `200ms` of the edit event.
5. THE EditorHeader SHALL render a page-width control with three selectable options labeled `'A4'` (constraining the canvas to 850px), `'Wide'` (1150px), and `'Full'` (no maximum width constraint).
6. WHEN the scroll position of the document desk area is greater than `0px`, THE EditorHeader SHALL apply a `backdrop-blur-md` effect; WHEN the scroll position returns to `0px`, THE EditorHeader SHALL remove the blur effect.
7. WHEN the concurrent presence data indicates one or more co-editors are active, THE EditorHeader SHALL render a user count badge using a muted amber background styling.

---

### Requirement 9: FullScreenEditor — Document Canvas

**User Story:** As a content editor, I want the writing area to feel like a clean, elevated document page, so that I can read and edit content with the same visual clarity as a word processor.

#### Acceptance Criteria

1. THE FullScreenEditor SHALL delegate the scrollable desk and paper sheet rendering to a dedicated `EditorCanvas` component that accepts the editor instance, a page-width setting, a drag-active flag, drag event handlers, and a field label as its interface.
2. THE EditorCanvas SHALL render a muted desk background that visually recedes behind a centered paper element, where the paper element appears elevated above the desk through a shadow, rounded corners, and a subtle border, in both light and dark color schemes.
3. WHEN the page-width setting is `"standard"`, THE EditorCanvas SHALL constrain the paper element to a maximum width of `850px`; WHEN the page-width setting is `"wide"`, the maximum width SHALL be `1150px`; WHEN the page-width setting is `"full"`, no maximum width constraint SHALL be applied; all width transitions SHALL animate over 300ms.
4. IF the page-width setting is a value other than `"standard"`, `"wide"`, or `"full"`, THEN THE EditorCanvas SHALL default to the `"standard"` maximum width of `850px`.
5. WHEN the drag-active flag is set, THE EditorCanvas SHALL render a fullscreen overlay covering the paper element, displaying an icon and text indicating that a file drop action is available, with a frosted-glass visual treatment applied to the overlay background.
6. THE EditorCanvas SHALL display the field label above the paper content area when a non-empty field label value is provided.
7. THE EditorCanvas SHALL apply a typographic scale to editor content such that: body paragraphs use a base font size with relaxed line height; H1 headings use a 2xl font size with bold weight and tight letter spacing; H2 headings use an xl font size with bold weight; H3 headings use a lg font size with bold weight.

---

### Requirement 10: FullScreenEditor — State and Keyboard Management

**User Story:** As a developer, I want the fullscreen editor's state and keyboard logic extracted into dedicated hooks, so that the component file is easier to read and the logic is independently testable.

#### Acceptance Criteria

1. THE FullScreenEditor SHALL extract editor lifecycle and derived state — including word count, character count, estimated reading time in minutes, and page width in pixels — into a `useEditorState` hook in `editor/hooks/`.
2. THE FullScreenEditor SHALL extract keyboard shortcut handling (Escape to close, ⇧⌘F to toggle fullscreen, Cmd+B and Cmd+I passthrough without calling `event.preventDefault()`) into a `useEditorKeyboard` hook in `editor/hooks/` that accepts `isMaximized: boolean`, `setIsMaximized: (v: boolean) => void`, `showTableModal: boolean`, and `showMediaPicker: boolean` as parameters.
3. WHEN `useEditorState` computes `wordCount` and `editor.getText()` returns an empty string or a string containing only whitespace characters, THE hook SHALL return `0`; WHEN `editor.getText()` returns a string with at least one non-whitespace character, THE hook SHALL return the count of tokens produced by splitting the string on one or more whitespace characters.
4. WHEN `useEditorState` computes `readingTimeMinutes`, THE hook SHALL return `Math.max(1, Math.ceil(wordCount / 200))`, ensuring the minimum returned value is `1`.
5. THE `useEditorKeyboard` hook SHALL register `keydown` event listeners on `window` with the `{ capture: true }` option and SHALL remove those listeners via a cleanup function returned from `useEffect`.

---

### Requirement 11: Serialization Fidelity and Round-Trip Integrity

**User Story:** As a developer, I want the refactored editor to produce identical HTML output for all existing content types, so that no stored content is broken or requires a data migration.

#### Acceptance Criteria

1. WHEN the editor serializes a block math node, THE Editor SHALL produce a `<div>` element with `data-type="math-formula"`, a `data-latex` attribute containing the LaTeX string, and a `data-display` attribute set to `"true"` or `"false"`, with attribute values equivalent to those produced by the current `MathFormula.renderHTML` for the same node data.
2. WHEN the editor serializes an inline math node, THE Editor SHALL produce a `<span>` element with `data-type="inline-math"` and a `data-latex` attribute containing the LaTeX string, with attribute values equivalent to those produced by the current `InlineMath.renderHTML` for the same node data.
3. WHEN the editor serializes a video node, THE Editor SHALL produce a `<video>` element with `src`, `alt`, `controls`, and `class` attributes whose values are equivalent to those produced by the current `Video.renderHTML` for the same node data; WHEN the editor serializes an audio node, THE Editor SHALL produce an `<audio>` element with the same attribute equivalence guarantee.
4. WHEN the editor serializes a coordinates node, THE Editor SHALL produce an `<iframe>` element with `data-type="coordinates"`, `data-lat`, `data-lng`, and `src` attributes whose values are equivalent to those produced by the current `Coordinates.renderHTML` for the same node data.
5. WHEN the editor serializes a code block node, THE Editor SHALL produce a `<pre>` element containing a `<code>` child, with `data-language`, `data-wrap`, and `class` attributes on the `<pre>` and a `class` attribute on the `<code>` whose values are equivalent to those produced by the current `CustomCodeBlock.renderHTML` for the same node data.
6. WHEN a SerializedHTML string produced by the current editor is loaded into the refactored editor and `getHTML()` is called, THE Editor SHALL produce a SerializedHTML string in which all `data-*` attribute values on custom nodes are identical to those in the original string; whitespace differences within text content nodes are acceptable.
7. THE `normalizeMathInHtml` function SHALL remain exported from `RichTextFieldRenderer` with the same function signature and behavior as in the current implementation, so that markdown import and paste handling continue to function correctly.

---

### Requirement 12: TypeScript Type Safety

**User Story:** As a developer, I want all refactored files to use strict TypeScript types, so that type errors are caught at compile time rather than at runtime.

#### Acceptance Criteria

1. THE Editor SHALL declare explicit prop interface types for every new or modified React component introduced in the refactor, with no props typed as `any`.
2. THE Editor SHALL type all Tiptap `addAttributes` return values using the explicit `Record<string, AttributeSpec>` shape rather than an inferred `any`.
3. THE Editor SHALL type all `addCommands` return values using the `RawCommands` interface declared in the module-augmentation block of `RichTextExtensions.tsx`, with no implicit `any` on command signatures.
4. THE Editor SHALL produce zero TypeScript compilation errors across all files under `extensions/`, `editor/components/`, and `editor/hooks/` when compiled with the `strict: true` flag as configured in the project `tsconfig.json`.
5. THE Editor SHALL not introduce new `@ts-ignore` or `@ts-expect-error` directives into any refactored file.
6. IF an unsafe cast cannot be avoided, THEN THE Editor SHALL include an inline comment on the same line explaining why the cast is necessary.

---

### Requirement 13: i18n Key Coverage

**User Story:** As an integrator, I want every UI string in the refactored editor to use the `t(key, fallback)` pattern, so that the CMS translation system can override any visible text without code changes.

#### Acceptance Criteria

1. THE Editor SHALL call `t('namespace:key', 'English fallback')` for every visible label, tooltip title, placeholder text, ARIA label, toast message, and prompt dialog string rendered in new or refactored UI components, using the `useTranslation` hook from `react-i18next`.
2. THE Editor SHALL declare all i18n keys used in new and refactored components in a local template file at `src/locales/en.json`, where each key entry's value is the corresponding English fallback string, so that translation teams have a complete and verifiable reference.
3. IF a new or refactored component renders any of the string categories listed in Criterion 1 without wrapping it in a `t()` call, THEN the build SHALL emit a lint warning or the review SHALL fail.
4. THE Editor SHALL not change any i18n key names that exist in `RichTextFieldRenderer.tsx` or `RichTextExtensions.tsx` at the time this requirement is implemented, so that existing translation files remain valid without updates.

---

### Requirement 14: Dark and Light Mode Compatibility

**User Story:** As a content editor, I want the refactored editor UI to respect the active theme in both light and dark modes, so that the visual experience is consistent regardless of user preference.

#### Acceptance Criteria

1. THE Editor SHALL use only the HSL CSS variable tokens defined in the project's Tailwind config (`background`, `foreground`, `border`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `surface`, `surface-foreground`, `destructive`, `destructive-foreground`, `input`, `ring`) for all color declarations in new and refactored `.tsx` and `.css` component files, with no hardcoded hex values, RGB values, HSL literals, or Tailwind palette color utilities (e.g., `bg-slate-800`, `text-zinc-100`, `bg-white`, `text-black`), whether applied via className or inline style props.
2. WHILE the `ThemeContext` value is `'dark'`, THE FullScreenEditor portal SHALL include the `dark` class on the outermost `div` rendered by the FullScreenEditor component (the direct child of the portal mount point), such that all descendant elements resolve CSS variable tokens against the `.dark` ruleset defined in `index.css`.
3. THE Editor SHALL not introduce any Tailwind color utility class from Tailwind's built-in color palette (including but not limited to `bg-white`, `text-black`, `bg-gray-*`, `text-zinc-*`, `bg-slate-*`) in new or refactored component files under `src/components/` and `src/extensions/`; only the project-defined semantic token utilities listed in Criterion 1 are permitted.
4. WHEN the user toggles the theme while the FullScreenEditor is open, THE FullScreenEditor SHALL apply the updated `dark` or absence-of-`dark` class to its outermost `div` within one React render cycle, such that the visual appearance of all editor UI elements reflects the new theme within 500 milliseconds of the toggle action.
