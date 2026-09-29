---
inclusion: always
---

### Internationalization (i18n) & Isolated Namespace Conventions
- **No Proprietary CMS i18n Imports:** Do not import production CMS localization packages, internal translation APIs, or `@/services/i18n` modules.
- **Dedicated Collision-Free Namespace (`editor.richTextUpdate`):**
  - All new, refactored, or modernized UI strings (toolbars, tooltips, popovers, badges, dialogs, error states) **MUST** strictly reside under the isolated namespace: `editor.richTextUpdate..`.
  - **Strict Prohibition:** Do NOT attach new keys directly to legacy root namespaces (e.g., avoid `editor.toolbar.*` or generic CMS keys) to prevent merge collisions with the existing production system.
- **Key Hierarchy & Dot-Notation Pattern:**
  - Floating Text Toolbar: `editor.richTextUpdate.toolbar.` (e.g., `editor.richTextUpdate.toolbar.bold`, `editor.richTextUpdate.toolbar.heading_2`)
  - KaTeX Math NodeView: `editor.richTextUpdate.math.` (e.g., `editor.richTextUpdate.math.symbol_palette`, `editor.richTextUpdate.math.syntax_error`)
  - Code Block NodeView: `editor.richTextUpdate.code.` (e.g., `editor.richTextUpdate.code.copy_success`, `editor.richTextUpdate.code.toggle_wrap`)
  - Table NodeView: `editor.richTextUpdate.table.` (e.g., `editor.richTextUpdate.table.insert_column`, `editor.richTextUpdate.table.delete_row`)
  - Media NodeViews: `editor.richTextUpdate.media.` (e.g., `editor.richTextUpdate.media.alt_badge_label`, `editor.richTextUpdate.media.floating_delete`)
- **Component Usage & Cataloging:**
  - In components, invoke the local mock helper: `t('editor.richTextUpdate..', 'English Fallback')`.
  - Automatically maintain and append all introduced keys to `src/locales/en.json` strictly nested under `editor` -> `richTextUpdate`.
  - **Deliverable Guarantee:** The resulting `richTextUpdate` object in `src/locales/en.json` must be entirely self-contained so it can be copied directly into the production CMS translation database in a single step without collision.