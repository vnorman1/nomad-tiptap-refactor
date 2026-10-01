/**
 * Code block extension module barrel export
 * Exports: CustomCodeBlock extension, NodeView, Toolbar, and language support
 *
 * Implemented in Tasks 5.1, 5.2, 5.3:
 * - CodeBlockExtension.tsx: Tiptap extension with parseHTML/renderHTML
 * - CodeBlockNodeView.tsx: React NodeView component
 * - CodeBlockToolbar.tsx: Toolbar UI component
 * - languageSupport.ts: Supported languages list
 *
 * @requirements 5.1, 5.2, 5.3, 5.8
 */

export { CustomCodeBlock } from './CodeBlockExtension';
export type { CustomCodeBlockOptions } from './CodeBlockExtension';

export { CodeBlockNodeView } from './CodeBlockNodeView';

export { CodeBlockToolbar } from './CodeBlockToolbar';
export type { CodeBlockToolbarProps } from './CodeBlockToolbar';

export {
  SUPPORTED_CODE_LANGUAGES,
  type CodeLanguage,
} from './languageSupport';
