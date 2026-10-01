/**
 * Extensions module barrel export
 * Central entry point for all Tiptap extensions used by RichTextFieldRenderer
 *
 * This file re-exports all 11 custom extensions organized by feature domain:
 * - Media: CustomImage, Video, Audio, Coordinates (4 extensions)
 * - Math: MathFormula, InlineMath (2 extensions)
 * - Code: CustomCodeBlock (1 extension)
 * - Table: CustomTable, CustomTableRow, CustomTableHeader, CustomTableCell (4 extensions)
 *
 * To be implemented across Tasks 3-6
 */

// ========================================
// Shared Toolbar Components and Hooks
// ========================================
export * from './shared/index';

// ========================================
// Media Extensions
// ========================================
export {
  CustomImage,
  Video,
  Audio,
  Coordinates,
} from './media/index';

// ========================================
// Math Extensions
// ========================================
export {
  MathFormula,
  InlineMath,
} from './math/index';

// ========================================
// Code Block Extension
// ========================================
export {
  CustomCodeBlock,
} from './code/index';

// ========================================
// Table Extensions
// ========================================
export {
  CustomTable,
  CustomTableRow,
  CustomTableHeader,
  CustomTableCell,
} from './table/index';
