# Design Document: Rich Text Editor Refactor

## Overview

This design refactors Nomad's monolithic rich text editor (~2500 lines) into a modular, feature-based architecture with modernized UI components. The refactor maintains 100% serialization fidelity while introducing a cleaner component hierarchy, shared toolbar primitives, and portal-based floating UIs.

**Key Design Goals:**
- Decompose two massive files into feature-domain modules (media, math, code, table, shared)
- Preserve all existing HTML serialization behavior (round-trip integrity)
- Replace static UI with context-aware floating toolbars
- Establish shared component primitives for consistent toolbar styling
- Improve testability through isolated modules and pure functions

---

## Architecture

### High-Level Module Organization

```
src/components/fields/FieldRendererComponents/
├── RichTextFieldRenderer.tsx          (main inline editor component)
├── extensions/                         (all Tiptap extensions and NodeViews)
│   ├── media/                          (CustomImage, Video, Audio, Coordinates)
│   │   ├── ImageExtension.tsx
│   │   ├── ImageNodeView.tsx
│   │   ├── VideoExtension.tsx
│   │   ├── VideoNodeView.tsx
│   │   ├── AudioExtension.tsx
│   │   ├── AudioNodeView.tsx
│   │   ├── CoordinatesExtension.tsx
│   │   ├── CoordinatesNodeView.tsx
│   │   └── index.ts
│   ├── math/                           (MathFormula, InlineMath)
│   │   ├── MathFormulaExtension.tsx
│   │   ├── MathFormulaNodeView.tsx
│   │   ├── InlineMathExtension.tsx
│   │   ├── InlineMathNodeView.tsx
│   │   ├── MathSymbolPalette.tsx
│   │   ├── mathSymbols.ts
│   │   └── index.ts
│   ├── code/                           (CustomCodeBlock)
│   │   ├── CodeBlockExtension.tsx
│   │   ├── CodeBlockNodeView.tsx
│   │   ├── CodeBlockToolbar.tsx
│   │   ├── languageSupport.ts
│   │   └── index.ts
│   ├── table/                          (table extensions)
│   │   ├── TableExtension.tsx
│   │   ├── TableRowExtension.tsx
│   │   ├── TableHeaderExtension.tsx
│   │   ├── TableCellExtension.tsx
│   │   └── index.ts
│   ├── shared/                         (hooks, toolbar components)
│   │   ├── toolbar/
│   │   │   ├── Toolbar_Button.tsx
│   │   │   ├── ToolbarSeparator.tsx
│   │   │   ├── ToolbarGroup.tsx
│   │   │   ├── ToolbarSelect.tsx
│   │   │   ├── FloatingPanel.tsx
│   │   │   ├── PreviewBox.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── index.ts
│   │   ├── useMathPreview.ts
│   │   ├── useMediaAttributes.ts
│   │   ├── useFloatingToolbar.ts
│   │   └── index.ts
│   └── index.ts                        (barrel export)
├── editor/                             (fullscreen editor)
│   ├── FullScreenEditor.tsx
│   ├── components/
│   │   ├── EditorHeader.tsx
│   │   ├── EditorCanvas.tsx
│   │   └── FileUploadOverlay.tsx
│   ├── hooks/
│   │   ├── useEditorState.ts
│   │   ├── useEditorKeyboard.ts
│   │   └── useTableModal.ts
│   └── index.ts
└── types/
    └── editor.ts                       (shared type definitions)
```

### Data Flow Diagram

```
User Input (click, type, select)
    ↓
Editor Event Handlers
    ├→ updateAttributes() [extension-specific]
    ├→ insertNode() [Tiptap command]
    └→ deleteNode() [Tiptap command]
    ↓
ProseMirror State Update
    ↓
Extension Serialization Rules
    ↓
HTML Output (editor.getHTML())
    ├→ Stored in field value
    └→ Parsed back on reload
    ↓
NodeView Re-render (React)
    ├→ Floating UI Portal (toolbars, editors)
    └→ Inline Node Display
```

---

## Components and Interfaces

### Shared Toolbar Components

All toolbar components use HSL CSS variable tokens (`--background`, `--foreground`, `--border`, `--primary`, etc.) and accept consistent prop interfaces.

#### Toolbar_Button
```typescript
interface Toolbar_ButtonProps {
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  title: string;
  variant?: 'toolbar' | 'menu' | 'ghost';
  disabled?: boolean;
}
```
- `'toolbar'`: bordered background on hover
- `'menu'`: full-width block layout
- `'ghost'`: no border/background
- When `isActive=true`, renders `bg-foreground text-background`

#### ToolbarSeparator, ToolbarGroup, ToolbarSelect, FloatingPanel, PreviewBox, StatusBadge
Standard toolbar UI primitives with consistent spacing, theming, and accessibility. Export from `extensions/shared/toolbar/index.ts`.

### NodeView Pattern (Extensions)

All custom NodeViews follow this pattern:
```typescript
const MyNodeView = () => {
  const { node, updateAttributes, deleteNode, selected, editor } = useNode();
  
  return (
    <div data-type="my-node">
      {/* Content */}
      {selected && <FloatingToolbar onDelete={deleteNode} />}
    </div>
  );
};

export const MyExtension = Node.create({
  name: 'myNode',
  group: 'block',
  addAttributes() {
    return { /* ... */ };
  },
  parseHTML() { /* ... */ },
  renderHTML() { /* ... */ },
  addNodeView() {
    return ReactNodeViewRenderer(MyNodeView);
  },
});
```

### Floating UI Pattern

**Portals for Context Escape:**
- Math editor, media editors, floating toolbar all render via `createPortal()` into `document.body`
- Positioned with `position: fixed` and `z-index: 999999`
- Recalculate position on `scroll` and `resize` events

**Implementation Example (Math Editor):**
```typescript
// Inside MathFormulaNodeView
const [showEditor, setShowEditor] = useState(false);
const [position, setPosition] = useState({ top: 0, left: 0 });

useEffect(() => {
  if (!showEditor) return;
  
  const updatePosition = () => {
    const rect = nodeRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  };
  
  updatePosition();
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
  return () => {
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
  };
}, [showEditor]);

return (
  <>
    <div ref={nodeRef}>{/* preview */}</div>
    {showEditor && createPortal(
      <FloatingPanel style={{ top: position.top, left: position.left }}>
        {/* editor UI */}
      </FloatingPanel>,
      document.body
    )}
  </>
);
```

### Serialization Strategy

**Round-Trip Fidelity:**
Each extension's `renderHTML()` must produce identical attribute structure to current implementation.

Example (Media):
```typescript
renderHTML({ node }) {
  return [
    'img',
    {
      src: node.attrs.src,
      alt: node.attrs.alt,
      'data-type': 'custom-image',
    },
  ];
}
```

On parse, `parseHTML()` extracts `data-*` attributes and rebuilds `node.attrs`.

**Validation Pattern:**
```typescript
// For all serialized HTML:
const html1 = editor1.getHTML(); // before refactor
const editor2 = new Editor({ content: html1 });
const html2 = editor2.getHTML();
// html1 and html2 should be equivalent (whitespace differences acceptable)
```

---

## Data Models

### Media Node Schema
```typescript
CustomImage: {
  attrs: {
    src: string;
    alt: string;        // can be empty
    altDict?: Record<string, string>; // { en: "...", fr: "..." }
  }
}
```

### Math Node Schema
```typescript
MathFormula: {
  attrs: {
    latex: string;      // non-empty, validated by KaTeX
    displayMode: boolean;
  }
}

InlineMath: {
  attrs: {
    latex: string;      // non-empty
  }
}
```

### Code Node Schema
```typescript
CustomCodeBlock: {
  attrs: {
    language: string;   // must match SUPPORTED_CODE_LANGUAGES[].id
    wrapLines?: boolean;
  }
}
```

### Table Cell Schema
```typescript
TableCell, TableHeader: {
  attrs: {
    colspan?: number;
    rowspan?: number;
    colwidth?: number[];
    background?: string; // hex or var(--token)
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Serialization Round-Trip Preserves All Node Data

*For any* valid editor state containing media, math, code, or table nodes, serializing the document to HTML and then parsing that HTML back into a fresh editor instance SHALL produce an identical serialized HTML when `getHTML()` is called on the new instance (allowing only whitespace normalization in text nodes).

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

### Property 2: Alt Text Display Resolution Follows Priority Order

*For any* media node with an alt text dictionary containing keys across multiple languages, displaying the alt text for a given active language SHALL resolve to: active language value → default language value → first available non-empty value → empty string, without falling back to a missing intermediate tier.

**Validates: Requirement 3.7**

### Property 3: Alt Badge Styling Reflects Alt Text Content State

*For any* media node, if the `alt` attribute contains at least one non-whitespace character, the ALT badge SHALL render with `bg-emerald-500/85 text-white` styling; if the `alt` attribute is null, empty, or contains only whitespace, the badge SHALL render with `bg-black/50 text-white mix-blend-difference` styling.

**Validates: Requirement 3.6**

### Property 4: Math Preview Updates Respond to LaTeX Input Changes

*For any* valid LaTeX string input in a math editor, updating the LaTeX input and waiting for the debounce timeout SHALL update the KaTeX preview within 150ms of the last keystroke, reflecting the current LaTeX state correctly or displaying an error message if KaTeX parsing fails.

**Validates: Requirement 4.5**

### Property 5: Word Count Calculation Is Consistent Across Text Variations

*For any* string input, calculating word count by splitting on whitespace and filtering empty tokens SHALL return 0 if the input is empty or whitespace-only, and SHALL return the count of non-empty tokens for any input containing at least one non-whitespace character, consistently across repeated calls.

**Validates: Requirement 10.3**

### Property 6: Reading Time Calculation Returns Minimum 1 Minute

*For any* word count value, calculating reading time as `Math.ceil(wordCount / 200)` and applying `Math.max(1, ...)` SHALL always return at least 1, never returning 0 regardless of word count.

**Validates: Requirement 10.4**

### Property 7: Toolbar Button Active State Styling Is Applied Consistently

*For any* `Toolbar_Button` instance, when the `isActive` prop is `true`, the button SHALL render with `bg-foreground text-background` styling; when `isActive` is `false` or undefined, the button SHALL NOT render those classes, allowing variant-specific styling to apply.

**Validates: Requirement 2.8**

### Property 8: Broken Media Nodes Render Warning Placeholder

*For any* media node with a `src` attribute that is absent, empty, or does not begin with a valid URI scheme (`http://`, `https://`, `/`, `./`, or `../`), rendering the NodeView SHALL display a `BrokenMediaWarning` placeholder instead of attempting to render the media element, with the floating action row still accessible on hover.

**Validates: Requirement 3.8**

### Property 9: Muted Mode Prevents UI Rendering Based on Editor State

*For any* Editor instance with disabled or read-only state, the `FloatingToolbar` component SHALL not render regardless of active text selection, preventing all floating UI from appearing.

**Validates: Requirement 7.6**

### Property 10: Code Block Language Selection Persists and Serializes

*For any* code block node, changing the language via the `ToolbarSelect` SHALL call `updateAttributes({ language: value })`, update the displayed language label within one render cycle, and serialize to HTML with the new `data-language` attribute value matching the selected language's `id`.

**Validates: Requirement 5.4, 5.7**

---

## Error Handling

### Math Formula Errors
- **Parse Error**: Display error message in warning box below preview, allow save
- **Invalid Input**: On blur/submit with empty latex, delete node
- **Render Error**: Show placeholder "Formula error" if KaTeX fails at display time

### Media Errors
- **Missing src**: Render `BrokenMediaWarning` placeholder
- **Invalid URL**: Show warning icon on node
- **Alt text edge cases**: Fallback to empty string if all language values are absent/empty

### Serialization Errors
- **Attribute mismatch**: Log warning, attempt graceful recovery
- **Unknown node type**: Skip node in serialization (ProseMirror default)
- **Round-trip failure**: Indicate data loss risk in UI before save

### Keyboard Handling
- **Escape in math editor**: Close editor if latex is non-empty; delete node if empty
- **Cmd+B/Cmd+I in editor**: Don't preventDefault—allow system behavior
- **Shift+Cmd+F**: Toggle fullscreen without interfering with input handlers

---

## Testing Strategy

### Property-Based Testing (PBT)

Run minimum 100 iterations per property using `vitest` with `@hypothesis/core` or similar property testing framework.

**Test Coverage:**

| Property | Generator Strategy | Edge Cases |
|----------|-------------------|-----------|
| 1. Round-trip serialization | Generate random content trees with all node types | Empty nodes, deeply nested, special characters |
| 2. Alt text resolution | Varied language dicts with missing/empty keys | All keys empty, single key, many languages |
| 3. Alt badge styling | Alt text content variation (empty, space-only, mixed) | Non-ASCII whitespace, mixed whitespace types |
| 4. Math preview updates | Generate valid/invalid LaTeX strings | Edge case operators, deeply nested braces |
| 5. Word count calculation | Text with varying whitespace (spaces, tabs, newlines, unicode) | Empty string, whitespace-only, very long text |
| 6. Reading time calculation | Word counts 0 to 10000 | Boundary: wordCount=0, 1, 200, 201 |
| 7. Toolbar button state | Vary isActive prop, variant combinations | Multiple re-renders with prop changes |
| 8. Broken media rendering | Invalid/missing src variations | Edge case schemes like `file://`, `blob:` |
| 9. Muted mode UI suppression | Toggle editor disabled state, maintain selections | Re-enable during active selection |
| 10. Code language persistence | All supported code languages, repeated changes | Unsupported language fallback |

**Test Structure Example:**
```typescript
// Feature: rich-text-refactor, Property 1: Serialization Round-Trip
import { test, expect } from 'vitest';
import fc from 'fast-check';

test('serialization round-trip preserves node data', () => {
  fc.assert(
    fc.property(generateEditorContent(), (content) => {
      const editor1 = createEditor({ content });
      const html1 = editor1.getHTML();
      
      const editor2 = createEditor({ content: html1 });
      const html2 = editor2.getHTML();
      
      expect(normalizeHtml(html1)).toBe(normalizeHtml(html2));
    }),
    { numRuns: 100 }
  );
});
```

### Unit Tests (Examples & Edge Cases)

- Media alt text display with missing language keys
- Math editor open/close behavior with keyboard shortcuts
- Code block copy-to-clipboard success/failure
- Table cell selection highlighting
- Floating toolbar positioning within viewport bounds

### Integration Tests

- Fullscreen editor header status badge updates on doc edit
- Dark/light theme switching applies CSS tokens correctly
- Serialized HTML from current implementation loads in refactored editor
- i18n keys resolve to correct fallback strings

---

## Implementation Patterns

### Hook Pattern: useNode() in NodeViews
```typescript
const { node, updateAttributes, deleteNode, selected, editor } = useNode();
```
Provides safe access to node state and Tiptap commands within React components.

### Portal Pattern: Floating UIs
```typescript
useEffect(() => {
  const updatePosition = () => { /* calculate position */ };
  updatePosition();
  window.addEventListener('scroll', updatePosition, true);
  return () => window.removeEventListener('scroll', updatePosition, true);
}, [visible]);

return createPortal(
  <FloatingPanel style={position}>{/* UI */}</FloatingPanel>,
  document.body
);
```
Always use `capture: true` for scroll events to catch them early.

### Serialization Pattern: Extension Definition
```typescript
addAttributes() {
  return {
    src: { default: null },
    alt: { default: '' },
  };
}
parseHTML() {
  return [{
    tag: 'img[data-type="custom-image"]',
    getAttrs: (el) => ({
      src: el.getAttribute('src'),
      alt: el.getAttribute('alt'),
    }),
  }];
}
renderHTML({ node }) {
  return ['img', {
    src: node.attrs.src,
    alt: node.attrs.alt,
    'data-type': 'custom-image',
  }];
}
```

### Theming Pattern: HSL Tokens
```typescript
// ✓ Correct
<div className="bg-background text-foreground border border-border">
  
// ✗ Incorrect (hardcoded or Tailwind palette)
<div className="bg-white text-black border border-gray-300">
```
All colors come from CSS variable tokens defined in `tailwind.config.js`.

---

## Constraints and Assumptions

1. **ProseMirror 4.x / Tiptap 2.x**: Extensions use current Tiptap API; no breaking upgrades during refactor
2. **React 18+**: Portal APIs and hook patterns assume React 18
3. **KaTeX 0.16+**: Math rendering relies on current KaTeX library
4. **Immutable Serialization**: HTML serialization rules do not change; old content must load without migration
5. **No Breaking Changes**: All existing `RichTextFieldRenderer` exports remain available
6. **Network-Agnostic**: Media URLs remain as stored; no re-validation or CDN changes
7. **Locale Fallback**: i18n keys fall back to English; no untranslated strings render without fallback

---

## Trade-Offs and Decisions

| Decision | Rationale | Trade-Off |
|----------|-----------|-----------|
| Portal-based floating UIs | Escape overflow-hidden containers, simpler z-index management | Slightly higher memory usage, portal cleanup required |
| Property-based testing for serialization | Catch edge cases in round-trip fidelity, comprehensive input coverage | Requires PBT library integration, slower test execution |
| Separate Extension and NodeView files | Improve readability, easier unit testing of logic | Slight increase in file count |
| HSL token-only theming | Guaranteed dark/light mode consistency, compile-time safety | Limited color flexibility, requires token additions for new colors |
| 300-line file limit | Prevent new monoliths, encourage focused modules | May split logically cohesive code |

---

## Success Metrics

1. **All 14 requirements satisfied** with zero violations
2. **Zero TypeScript errors** with `strict: true`
3. **Serialization round-trip fidelity** 100% — no HTML differences beyond whitespace
4. **All property tests pass** with 100+ iterations each
5. **Bundle size** ≤ 5% larger than current (refactoring adds module overhead but removes redundancy)
6. **Test coverage** ≥ 85% across all extension modules
7. **No breaking changes** — existing consumer code continues to work unchanged

