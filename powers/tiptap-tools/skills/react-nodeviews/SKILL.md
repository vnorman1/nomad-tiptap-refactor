# Advanced React NodeViews Implementation Skill

## 1. KaTeX Math Block NodeView
- **Dual State**: Rendered LaTeX view in preview mode; instant Monaco/textarea toggle on click.
- **Error Boundary**: Wrap `katex.renderToString` in an inline error handler displaying a red outline and warning badge rather than crashing the ProseMirror document.
- **Serialization**: Always serialize into strict `$$\n\n$$` blocks.

## 2. Syntactic Code Block
- **Features**: Programming language dropdown selector, syntax highlighting via lowlight/Prism, and a one-click "Copy Code" button.
- **Tab Handling**: Intercept `Tab` to insert 2 spaces instead of moving browser focus out of the editor.

## 3. Resizable Media & Embeds
- Encase images and video embeds in a responsive wrapper with subtle drag handles on left/right edges.
- Store width and alignment as ProseMirror node attributes (`data-width`, `data-align`).