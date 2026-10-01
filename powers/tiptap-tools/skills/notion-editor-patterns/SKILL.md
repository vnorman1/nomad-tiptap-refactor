---
name: notion-editor-patterns
description: Formal specification and implementation patterns for Notion-style block editors, floating bubble menus, React NodeViews, and slash commands.
---

# Notion-Style Rich Text Editor Patterns (TipTap & React Specification)

## 1. Visual Hierarchy & Floating Canvas Specification

### 1.1 Canvas State Invariants

* The root document canvas SHALL render distraction-free with zero fixed top-level formatting bars.
* Formatting controls SHALL remain unmounted OR hidden UNTIL text selection occurs OR an interactive block is hovered.
* WHEN a text range is active AND selection is NOT collapsed:
* THEN the system SHALL mount or position the floating `BubbleMenu`.
* AND the menu SHALL calculate coordinates relative to the viewport bounding client rect.



### 1.2 Portal & Stacking Context Isolation

* Floating menus MUST be rendered into a React Portal attached directly to `document.body`.
* Implementations SHALL NOT render floating menus inside the editor DOM container to prevent clipping caused by parent `overflow: hidden` OR relative stacking context traps.
* WHEN calculating floating positions:
* The menu SHALL enforce a viewport collision boundary of at least 8px.
* IF vertical space above the selection is `< 48px`:
* THEN the menu SHALL flip to display BELOW the selection.
* ELSE the menu SHALL remain anchored ABOVE the selection.





### 1.3 Focus Retention & Click Bubbling Rules

* All interactive buttons inside floating menus MUST register `onMouseDown={(e) => e.preventDefault()}`.
* IF `preventDefault()` is omitted on mousedown:
* THEN mouse clicks SHALL trigger browser blur events.
* AND the editor SHALL lose active selection before dispatching the format transaction.


* Action triggers SHALL execute via chained transactions AND preserve focus:
* `editor.chain().focus().toggleBold().run()`



---

## 2. React NodeView Architecture & State Isolation

### 2.1 Component Encapsulation

* Complex blocks (Math, Syntactic Code, Media, Callouts) SHALL be wrapped using `ReactNodeViewRenderer`.
* The outermost rendered element MUST be a clean `NodeViewWrapper` component.
* The `NodeViewWrapper` SHALL NOT define structural positioning styles that interfere with ProseMirror coordinate mapping.
* Editable rich text child zones MUST be encapsulated inside a `NodeViewContent` element.

### 2.2 Hydration & Render Optimization

* Custom React NodeViews MUST be wrapped in `React.memo`.
* WHEN evaluating component re-renders:
* The comparator SHALL inspect attribute equality (`prevProps.node.attrs === nextProps.node.attrs`).
* AND the comparator SHALL verify selection state (`prevProps.selected === nextProps.selected`).


* Next.js / SSR Integration Rule:
* Editors running in SSR frameworks MUST specify `immediatelyRender: false` in constructor options.
* OR the system SHALL defer editor instantiation until the client mount cycle completes (`useEffect`).



### 2.3 Transient State Lifecycle

* IF a NodeView requires internal draft state (such as formula editing OR symbol selection):
* THEN the draft state SHALL remain local to the component (`useState`).
* AND global ProseMirror document transactions SHALL NOT be dispatched on every keystroke.
* WHEN confirmation occurs (`Cmd+Enter` OR blur):
* THEN the component SHALL call `updateAttributes({ ... })` in a single transaction.





---

## 3. Slash Commands (`/`) Pipeline Specification

### 3.1 Trigger & Activation Lifecycle

* The suggestion engine MUST intercept raw input matching the `/` trigger character at the start of a block OR following a whitespace.
* WHEN the trigger character is entered:
* THEN the system SHALL open a floating command dropdown anchored to the cursor coordinates.
* AND keyboard listeners for `ArrowUp`, `ArrowDown`, `Enter`, and `Escape` SHALL activate.



### 3.2 Keyboard Navigation Contract

* WHEN navigating active suggestion menus:
* `ArrowDown` SHALL increment active selection index (clamped or modulo list length).
* `ArrowUp` SHALL decrement active selection index.
* `Escape` MUST close the suggestion menu AND retain cursor position without modifying text.
* `Enter` OR `Tab` MUST execute the selected command.



### 3.3 Execution & Document Mutation Invariant

* WHEN a slash command is executed:
* THEN the engine MUST delete the trigger text range (e.g. `/math` or `/table`).
* AND the engine MUST insert the corresponding node in the SAME transaction.
* Multi-step transaction splits SHALL NOT be permitted to preserve clean undo/redo history.



### 3.4 Command Taxonomy

* Available commands SHALL be grouped into three distinct categories:
* **Basic Blocks**: Text, Heading 1, Heading 2, Bullet List, Numbered List, Quote.
* **Containers & Media**: Table, Image, Callout block, Horizontal divider.
* **Advanced Nodes**: KaTeX Math block, Syntactic Code block with language selector.



---

## 4. KaTeX Math Block & Syntax Serialization Invariants

### 4.1 Storage & Delimiter Contracts

* Math nodes SHALL maintain two primary schema attributes: `latex` (string) and `display` (boolean).
* WHEN serializing math nodes to raw text or markdown:
* Block math SHALL serialize strictly as:
```text
$$

$$

```


* Inline math SHALL serialize strictly as:
`$$`
* Parsers MUST retain all internal Unicode characters, linebreaks, and LaTeX control sequences without dropping attributes.

### 4.2 Error Boundaries & Graceful Degradation

* All rendering calls to `katex.renderToString` MUST be wrapped inside a defensive `try / catch` boundary.
* IF `katex.renderToString` throws a parse error:
* THEN the NodeView SHALL catch the exception.
* AND the NodeView SHALL render an inline warning container with the raw LaTeX visible.
* AND the editor process SHALL NOT throw an uncaught error or unmount ProseMirror.



### 4.3 NodeView Keyboard Contract

* WHEN the LaTeX editor overlay is open:
* `Cmd+Enter` (macOS) OR `Ctrl+Enter` (Windows/Linux) SHALL persist the formula AND close edit mode.
* `Escape` with non-empty formula SHALL discard local changes AND close edit mode without updating attributes.
* `Escape` with an empty formula on an uninitialized node SHALL call `deleteNode()` to prevent ghost empty blocks.



---

## 5. Transaction Hygiene & Selection Rules

### 5.1 Transaction Atomicity

* Complex operations MUST execute via chained transaction builders (`editor.chain()`).
* Developers SHALL NOT dispatch multiple independent transactions for a single user action.
* Every state change affecting the document tree MUST yield exactly one history checkpoint for `undo` / `redo`.

### 5.2 Selection Restoration Contract

* WHEN applying node transformations OR toggling formats:
* THEN focus MUST be explicitly retained: `editor.chain().focus().[action].run()`.
* IF `focus()` is omitted:
* THEN the cursor position MAY desynchronize from the active ProseMirror document view.