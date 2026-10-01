/**
 * RichTextExtensions - Modular Tiptap Extensions Entry Point
 * 
 * Re-exports all modular extensions built in the refactor project.
 * This replaces the 2500-line monolithic file with clean imports
 * from feature-based extension modules (media, math, code, table).
 * 
 * Features imported:
 * - Media: CustomImage, Video, Audio, Coordinates extensions with NodeViews
 * - Math: MathFormula, InlineMath extensions with NodeViews and MathSymbolPalette
 * - Code: CustomCodeBlock extension with CodeBlockNodeView and toolbar
 * - Table: CustomTable, CustomTableRow, CustomTableHeader, CustomTableCell extensions
 * 
 * @requirements: 1.2, 2.9, 3.9, 4.1, 5.10, 6.6, 11.1-11.7, 12.1, 12.4
 */

import { mergeAttributes, Node } from '@tiptap/core';
import { getCentralAlt } from './types';
import { I18N_CONFIG } from '@/config/admin.config';

// Import modular extensions from the refactored architecture
import {
  CustomImage,
  Video, 
  Audio,
  Coordinates,
  MathFormula,
  InlineMath,
  CustomCodeBlock,
  CustomTable,
  CustomTableRow,
  CustomTableHeader,
  CustomTableCell
} from './extensions';

// Re-export NodeViews for RichTextFieldRenderer
export { ImageNodeView } from './extensions/media/ImageNodeView';
export { VideoNodeView } from './extensions/media/VideoNodeView';
export { AudioNodeView } from './extensions/media/AudioNodeView';
export { CoordinatesNodeView } from './extensions/media/CoordinatesNodeView';
export { MathFormulaNodeView } from './extensions/math/MathFormulaNodeView';
export { InlineMathNodeView } from './extensions/math/InlineMathNodeView';
export { CodeBlockNodeView } from './extensions/code/CodeBlockNodeView';
export { MathSymbolPalette } from './extensions/math/MathSymbolPalette';

// Re-export Floating Toolbar component and hook
export { FloatingToolbar } from './extensions/shared/FloatingToolbar';
export type { FloatingToolbarProps } from './extensions/shared/FloatingToolbar';
export { useFloatingToolbar, calculateToolbarPosition } from './extensions/shared/useFloatingToolbar';
export type { FloatingToolbarResult, UseFloatingToolbarOptions } from './extensions/shared/useFloatingToolbar';

// Export utility functions used by RichTextFieldRenderer
export function getResolvedCentralAlt(src: unknown): string {
  const central = getCentralAlt(src);
  const defLang = I18N_CONFIG.defaultLanguage || 'hu';
  return central[defLang] || Object.values(central)[0] || '';
}

// Command declarations for Tiptap type extensions
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; alt?: string }) => ReturnType;
    };
    audio: {
      setAudio: (options: { src: string; alt?: string }) => ReturnType;
    };
    coordinates: {
      setCoordinates: (options: { lat: string; lng: string }) => ReturnType;
    };
    customTable: {
      insertNomadTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType;
    };
    mathFormula: {
      setMathFormula: (options?: { latex?: string; display?: boolean }) => ReturnType;
    };
    inlineMath: {
      insertInlineMath: (options?: { latex?: string }) => ReturnType;
    };
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

// PageBreak extension - maintains compatibility with existing documents
export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>;
}

const PageBreak = Node.create<PageBreakOptions>({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'my-8',
      },
    };
  },

  addAttributes() {
    return {};
  },

  parseHTML() {
    return [
      {
        tag: 'hr[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'page-break',
    })];
  },

  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {},
        });
      },
    };
  },
});

// Re-export extensions for RichTextFieldRenderer
export {
  // Media extensions
  CustomImage,
  Video,
  Audio,
  Coordinates,
  
  // Math extensions
  MathFormula,
  InlineMath,
  
  // Code extension
  CustomCodeBlock,
  
  // Table extensions
  CustomTable,
  CustomTableRow,
  CustomTableHeader,
  CustomTableCell,
  
  // PageBreak extension (legacy, kept for compatibility)
  PageBreak
};

// Export types for external use
export type { CustomCodeBlockOptions } from './extensions/code/CodeBlockExtension';
export type { MathSymbolPaletteProps } from './extensions/math/MathSymbolPalette';
export type { MathCategory, MathSymbol } from './extensions/math/mathSymbols';

/**
 * Migration Notes:
 * - All extensions now reside in feature-based directories (media/, math/, code/, table/)
 * - NodeViews are exported separately for direct usage if needed
 * - All i18n keys follow editor.richTextUpdate.* namespace pattern
 * - All styling uses HSL token-only theming (no hardcoded colors)
 * - All serialization maintains round-trip fidelity with existing HTML formats
 * 
 * The modular architecture enables:
 * - Independent testing of extensions
 * - Smaller bundle sizes via tree-shaking
 * - Clearer code organization and maintainability
 * - Reusable components across the codebase
 */

