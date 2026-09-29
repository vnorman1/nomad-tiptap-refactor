# Feature Specification: Modular TipTap Rich Text Editor & Modern UI Refactor

## 1. Problem Statement & Background
The rich text editor currently relies on monolithic files (`RichTextExtensions.tsx` and legacy renderers), grouping all extension logic, ProseMirror schemas, and React NodeViews into single files. This creates maintenance friction, makes testing individual behaviors difficult, and limits UI flexibility.

Additionally, the editing experience requires a UI modernization: transitioning from static/fixed toolbars to a **modern, minimalist, floating context-aware UI** (inspired by Notion and Figma) featuring subtle visual hierarchy, smooth transitions, and dedicated React NodeViews for media, math, code, and tables.

## 2. Core Requirements & Invariants
- **Modular Directory Layout:** Group extensions into feature domains (`extensions/media`, `extensions/math`, `extensions/code`, `extensions/table`, `extensions/shared`).
- **UI Modernization (Primary Focus):**
  - Context-aware floating toolbars on selection/hover.
  - Interactive React NodeViews (live KaTeX editing, code block header chrome, inline table controls).
  - Clean visual hierarchy with zero clutter and smooth transitions.
- **Strict Typing:** 100% TypeScript with zero `any` types.
- **Serialization Invariants:** Document structure, HTML serialization, and custom attributes (e.g., LaTeX delimiters, language attributes) must remain strictly preserved across saves.
- **Decoupled Architecture:** No proprietary CMS backend dependencies; runs as a standalone testbed component.
- **Decoupled i18n Strategy:** 
  - Production CMS translation files are excluded from this repository.
  - All new and refactored UI components must reference structured keys via a local `t(key, fallback)` helper.
  - All declared keys must be mirrored in a clean template dictionary (`src/locales/en.json`), ready for straightforward CMS integration.