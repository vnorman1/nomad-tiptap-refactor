# 🚀 Nomad Modular TipTap Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![TipTap](https://img.shields.io/badge/TipTap-3.x-black.svg)](https://tiptap.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Fast-Check PBT](https://img.shields.io/badge/PBT-fast--check_4.x-purple.svg)](https://fast-check.dev/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-yellow.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **A production-grade, headless, and modular rich text editing engine built on TipTap and ProseMirror.**  
> Originally refactored from a 2500+ line monolithic editor into clean, independently consumable feature domains with modern interactive React NodeViews, context-aware floating toolbars, and formal Property-Based Testing (PBT) verification.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Directory Structure](#-directory-structure)
- [Quick Start](#-quick-start)
- [How to Use in Any Project](#-how-to-use-in-any-project)
- [Component Details](#-component-details)
  - [Floating Toolbar](#1-floating-selection-toolbar)
  - [KaTeX Math Formulas](#2-katex-math-formulas)
  - [Code Block with Chrome](#3-code-block-with-macos-chrome)
  - [Interactive Tables](#4-interactive-tables)
  - [Media & Coordinates](#5-media--coordinates)
- [Design System & HSL Theming](#-design-system--hsl-theming)
- [Formal Verification & Property-Based Testing (PBT)](#-formal-verification--property-based-testing-pbt)
- [License](#-license)

---

## 🎯 Overview

The **Nomad Modular TipTap Engine** is designed to break down the monolithic coupling common in rich text editing stacks. It replaces unwieldy single-file setups with a clean, domain-driven architecture that is:

1. **Universally Reusable**: Decoupled from any proprietary CMS backend. Works as a self-contained, standalone component in any React application.
2. **Feature-Domain Isolated**: Media, Math (KaTeX), Code Blocks, Tables, and Shared Toolbars live in distinct, tree-shakeable packages.
3. **Interactive React NodeViews**: Live formula editing, floating portals, keyboard state machines, and copy/action controls.
4. **Mathematically Verified**: Backed by formal Property-Based Testing (PBT) with `fast-check` to guarantee round-trip serialization fidelity, delimiter collision resistance, step inversion, and XSS immunity.

---

## ✨ Key Features

- **Context-Aware Floating Selection Toolbar**: Automatically appears centered 8px above (or below, if near the viewport top) non-empty text selections with smooth fade animations.
- **Dual-Mode KaTeX Math**:
  - Standalone Block formulas (`$$...$$`) and Inline expressions (`$...$`).
  - Floating portal editor with 150ms debounced live preview.
  - Categorized LaTeX Symbol Palette with smart cursor slot injection (`{a}`, `{x}`, `{n}`, `{}`).
  - Deterministic keyboard state handling (<kbd>Cmd</kbd>+<kbd>Enter</kbd> to save, <kbd>Esc</kbd> to cancel/delete).
- **Modern Code Block with macOS Chrome**:
  - macOS-inspired window controls (red/yellow/green dots).
  - 19+ supported programming languages dropdown selector.
  - One-click copy-to-clipboard button and line wrapping toggle.
- **Dynamic Table Engine**:
  - TipTap table suite (`CustomTable`, `CustomTableRow`, `CustomTableHeader`, `CustomTableCell`).
  - Floating `TableActionBar` with row/column insertion, deletion, and header toggling.
  - Keyboard navigation shortcuts (<kbd>Alt</kbd>+<kbd>Arrow Keys</kbd>).
- **Responsive Media & Geolocation**:
  - Image block with live alt-text editor and central language fallback chains.
  - Broken media detection with visual placeholder fallbacks.
  - Responsive Video player, Audio player, and Google Maps Coordinates card.
- **100% HSL Token Theming**: Seamless dark/light theme switching with zero hardcoded HEX/RGB values.

---

## 🏛️ Architecture

```mermaid
graph TD
    App["Showcase Application (App.tsx)"] --> FieldRenderer["RichTextFieldRenderer"]
    FieldRenderer --> RichTextExtensions["RichTextExtensions Entry Point"]
    
    subgraph ModularEngine ["Modular Engine (/src/.../extensions/)"]
        RichTextExtensions --> MediaModule["extensions/media"]
        RichTextExtensions --> MathModule["extensions/math"]
        RichTextExtensions --> CodeModule["extensions/code"]
        RichTextExtensions --> TableModule["extensions/table"]
        RichTextExtensions --> SharedModule["extensions/shared"]
        
        MediaModule --> ImgNV["ImageNodeView"]
        MediaModule --> VidNV["VideoNodeView"]
        MediaModule --> AudNV["AudioNodeView"]
        MediaModule --> CoordNV["CoordinatesNodeView"]
        
        MathModule --> MathFormulaNV["MathFormulaNodeView"]
        MathModule --> InlineMathNV["InlineMathNodeView"]
        MathModule --> MathPalette["MathSymbolPalette"]
        
        CodeModule --> CodeNV["CodeBlockNodeView"]
        CodeModule --> CodeTB["CodeBlockToolbar"]
        
        TableModule --> TableAB["TableActionBar"]
        TableModule --> TableCSS["table.css Tokenized Selection"]
        
        SharedModule --> FloatTB["FloatingToolbar Component"]
        SharedModule --> UseFloatTB["useFloatingToolbar Hook"]
        SharedModule --> UIPrimitives["Toolbar UI Primitives"]
        SharedModule --> MathPrev["useMathPreview / KaTeX Hook"]
    end

---

## 📁 Directory Structure

```
src/components/fields/FieldRendererComponents/
├── RichTextExtensions.tsx       # Central modular entry point & command typings
├── RichTextFieldRenderer.tsx    # Complete editor container & renderer
├── extensions/
│   ├── index.ts                 # Unified barrel export
│   ├── shared/                  # Common primitives and hooks
│   │   ├── FloatingToolbar.tsx  # Floating selection toolbar component
│   │   ├── useFloatingToolbar.ts# Selection tracking & collision math
│   │   ├── useMathPreview.ts    # Isolated KaTeX preview renderer
│   │   ├── toolbar/             # Button, Group, Separator, Select, Badge
│   │   └── types.ts             # Shared editor type declarations
│   ├── math/                    # KaTeX mathematical notation
│   │   ├── MathFormulaExtension.tsx # Block math node ($$...$$)
│   │   ├── InlineMathExtension.tsx  # Inline math node ($...$)
│   │   ├── MathFormulaNodeView.tsx  # Block formula editor NodeView
│   │   ├── InlineMathNodeView.tsx   # Inline formula editor NodeView
│   │   ├── MathSymbolPalette.tsx    # Symbol shortcut picker grid
│   │   ├── mathSymbols.ts           # Categorized LaTeX symbols database
│   │   └── MathExtensions.pbt.test.ts # Fast-Check Property-Based Tests
│   ├── code/                    # Code block extension
│   │   ├── CustomCodeBlockExtension.tsx # TipTap code block extension
│   │   ├── CodeBlockNodeView.tsx    # NodeView with interactive header
│   │   ├── CodeBlockToolbar.tsx     # Language select & copy buttons
│   │   └── languageSupport.ts       # 19 supported languages map
│   ├── table/                   # Dynamic data grids
│   │   ├── CustomTableExtension.tsx # Table node with column resizing
│   │   ├── TableRowExtension.tsx    # Row node
│   │   ├── TableHeaderExtension.tsx # Header cell node
│   │   ├── TableCellExtension.tsx   # Data cell node
│   │   ├── TableActionBar.tsx       # Floating table controls
│   │   ├── useTableActionBar.ts     # Keyboard shortcuts (Alt+Arrows)
│   │   └── table.css                # Tokenized cell selection styling
│   └── media/                   # Media & Geolocation
│       ├── CustomImageExtension.tsx # Image node with alt-text support
│       ├── ImageNodeView.tsx        # Image view with alt popover
│       ├── VideoExtension.tsx       # Video embed node
│       ├── VideoNodeView.tsx        # Video player NodeView
│       ├── AudioExtension.tsx       # Audio embed node
│       ├── AudioNodeView.tsx        # Audio player NodeView
│       ├── CoordinatesExtension.tsx # Geolocation map node
│       └── CoordinatesNodeView.tsx  # Interactive map view
```

---

## ⚡ Quick Start

The repository includes a ready-to-run interactive showcase demonstrating all extensions:

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to explore the editor workbench.

### 3. Run test suites
```bash
# Run all unit and property-based tests
npx vitest run

# Run specific math PBT test suite
npx vitest run src/components/fields/FieldRendererComponents/extensions/math/MathExtensions.pbt.test.ts

# Run floating toolbar tests
npx vitest run src/components/fields/FieldRendererComponents/extensions/shared/FloatingToolbar.test.tsx
```

---

## 🔌 How to Use in Any Project

Because every extension is standalone and decoupled from the CMS backend, you can pick and choose exactly what you need.

### Example: Consuming the Full Suite in a React Component

```tsx
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// 1. Import extensions and components from the modular barrel
import {
  MathFormula,
  InlineMath,
  CustomCodeBlock,
  CustomTable,
  CustomTableRow,
  CustomTableHeader,
  CustomTableCell,
  CustomImage,
  Video,
  Audio,
  Coordinates,
  FloatingToolbar,
} from './components/fields/FieldRendererComponents/RichTextExtensions';

export function MyRichTextEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Replaced by CustomCodeBlock
      }),
      // Math support
      MathFormula,
      InlineMath,
      // Enhanced Code Block
      CustomCodeBlock,
      // Advanced Tables
      CustomTable.configure({ resizable: true }),
      CustomTableRow,
      CustomTableHeader,
      CustomTableCell,
      // Rich Media
      CustomImage,
      Video,
      Audio,
      Coordinates,
    ],
    content: `
      <h1>Hello TipTap!</h1>
      <p>Inline formula: $E = mc^2$</p>
      <p>Select any text to see the floating toolbar appear!</p>
    `,
  });

  return (
    <div className="relative border border-border rounded-xl p-4 bg-background text-foreground">
      {/* 2. Mount the floating toolbar (automatically portals to document.body on selection) */}
      {editor && <FloatingToolbar editor={editor} />}

      {/* 3. Render the editor canvas */}
      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
    </div>
  );
}
```

---

## 🔍 Component Details

### 1. Floating Selection Toolbar
- **Trigger**: Appears dynamically whenever a user selects text within the editor.
- **Positioning**: Automatically calculates the center point of the selection, placing the toolbar 8px above. If the selection is within 60px of the viewport top, it flips below to prevent clipping.
- **Protection**: Intercepts `onMouseDown` with `preventDefault()` to prevent the editor from losing selection focus when buttons are clicked.
- **Groups**:
  1. *Text Formatting*: Bold, Italic, Underline, Strikethrough, Inline Code, Superscript, Subscript, Link.
  2. *Block Formatting*: Paragraph, Heading 1-3, Blockquote, Bullet List, Ordered List, Code Block.
  3. *Inserts*: Table, Math Formula, Inline Math, Image, Video, Audio.

### 2. KaTeX Math Formulas
- **Dual Representation**:
  - `MathFormula`: Block-level atom node (`<div data-type="math-formula" data-latex="...">`).
  - `InlineMath`: Inline atom node (`<span data-type="inline-math" data-latex="...">`).
- **Live Preview**: 150ms debounced preview rendering using KaTeX.
- **Symbol Palette**: Grid containing Greek letters, calculus symbols, and bracket pairs. Clicking a template like `\frac{a}{b}` automatically replaces selected text into `{a}` or places the cursor into the numerator.

### 3. Code Block with macOS Chrome
- **Visuals**: macOS-style traffic light window controls with dark/light background adaptation.
- **Features**:
  - Language selector with 19+ languages (TypeScript, JavaScript, Python, Rust, Go, HTML, CSS, SQL, etc.).
  - Copy button with visual feedback indicator.
  - Word wrap toggle.

### 4. Interactive Tables
- **Customizable**: Resizable columns, header cell highlight, and top-aligned cell contents.
- **TableActionBar**: Floating contextual bar positioned directly over active table cells offering one-click row/column management and header row toggles.
- **Keyboard Shortcuts**: <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> for row operations, <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd> for column operations.

### 5. Media & Coordinates
- **Alt Text Editor**: Floating badge on images that opens an inline modal to edit SEO & accessibility alt tags.
- **Broken Media Detection**: Automatically detects empty or unresolvable URLs and displays an elegant warning fallback without crashing the editor.

---

## 🎨 Design System & HSL Theming

All components strictly use CSS HSL variables compatible with modern Tailwind CSS design tokens. No hardcoded HEX or RGB colors are used anywhere in the codebase.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --border: 240 3.7% 15.9%;
}
```

---

## 🧪 Formal Verification & Property-Based Testing (PBT)

This engine adheres to formal ProseMirror testing invariants specified in [`powers/tiptap-tools/skills/prosemirror-testing/SKILL.md`](powers/tiptap-tools/skills/prosemirror-testing/SKILL.md).

The test suite in [`MathExtensions.pbt.test.ts`](src/components/fields/FieldRendererComponents/extensions/math/MathExtensions.pbt.test.ts) uses **fast-check** to verify 5 core mathematical and structural invariant laws across thousands of randomly generated inputs:

1. **Structural Isomorphism Contract**:
   $$\forall \text{ node } N, \quad \text{schema.nodeFromJSON}(N\text{.toJSON}()) \equiv N \quad \land \quad \text{parseHTML}(\text{renderHTML}(N)) \equiv N\text{.attrs}$$
   Guarantees that no attributes (`latex`, `display`, etc.) mutate their types (e.g. booleans never become strings) or are lost during round-trip serialization.

2. **Delimiter Boundary & Collision Resistance**:
   $$\text{parse}(\text{serialize}(\text{payload})) \equiv \text{payload}$$
   Guarantees that LaTeX formulas containing embedded delimiters (such as `$$a + b = c$$` inside `\text{$$10}` or `$x=1$`) are escaped defensively to prevent premature delimiter block truncation.

3. **Step Inversion Mathematical Law**:
   $$\forall \text{ doc } D_0, \text{ atomic step } S: \quad S^{-1}(S(D_0)) \equiv D_0$$
   Guarantees that inserting or modifying math nodes is 100% invertible through atomic ProseMirror transactions.

4. **Defensive Security & Total Function Contract**:
   `renderMathPreview({ latex, displayMode })` is mathematically guaranteed to be a **total function** (never throws unhandled exceptions or crashes runtime, regardless of binary or malformed inputs), and malicious XSS vectors (`<script>`, `onerror=`, `javascript:`) are neutralised and never emit executable tags.

5. **Snippet Cursor Arithmetic Invariants**:
   For any text buffer and selection range $[s, e]$, inserting template snippets yields exact length arithmetic:
   $$L_{\text{next}} = s + L_{\text{insertion}} + (L_{\text{base}} - e), \quad 0 \le \text{newCursorPos} \le L_{\text{next}}$$

---

## 🛠️ Built with Kiro (Kiro University Challenge)

This project was engineered using Kiro as the primary development environment, showcasing spec-driven architecture, automated quality gates, and agent extensibility:

- **Specs-Driven Refactoring (`.kiro/specs/`)**: The complete monolithic decomposition roadmap and acceptance criteria were formally driven by `.kiro/specs/rich-text-refactor.md`.
- **Quality Steering (`.kiro/steering/`)**: Enforced strict ProseMirror transaction patterns and banned untyped `any` assignments via `.kiro/steering/editor-conventions.md`.
- **Pre-Save Hooks (`.kiro/hooks/`)**: Automated typechecking (`tsc --noEmit`), code formatting, and protected-file mutation guards via blocking hooks (`on-save.json`).
- **Custom Power (`powers/tiptap-tools`)**: Built an open, portable agent Power containing 3 specialized skills:
  - `notion-editor-patterns`: Bubble menus, focus traps, and portal contracts.
  - `react-nodeviews`: Isolated React NodeView lifecycles and KaTeX fallbacks.
  - `prosemirror-testing`: Formal property-based testing and schema invariant guidelines.
- **Model Context Protocol (MCP)**: Integrated `fetch` and `puppeteer` servers for live TipTap documentation validation and headless DOM regression verification.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it in your own applications.
