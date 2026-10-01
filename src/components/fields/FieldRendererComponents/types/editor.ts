/**
 * Core type definitions for the Rich Text Editor refactor
 * Defines shared node schemas, attribute specs, and editor-level types
 */

import type { AttributeSpec } from '@tiptap/pm/model';

/**
 * HSL theme token names used throughout the editor UI
 */
export type ThemeToken =
  | 'background'
  | 'foreground'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'muted-foreground'
  | 'border'
  | 'shadow'
  | 'success';

/**
 * Generic Record type for extension attributes
 * All extensions must define their attributes using this shape
 */
export type ExtensionAttributes = Record<string, AttributeSpec>;

/**
 * Media node schemas - Image, Video, Audio, Coordinates
 */
export interface MediaNodeAttrs {
  src: string;
  alt?: string;
  altDict?: Record<string, string>;
  lat?: number;
  lng?: number;
  controls?: boolean;
}

/**
 * Math node schemas - MathFormula (block) and InlineMath (inline)
 */
export interface MathNodeAttrs {
  latex: string;
  displayMode?: boolean;
}

/**
 * Code block node schema - CustomCodeBlock
 */
export interface CodeBlockNodeAttrs {
  language: string;
  wrapLines?: boolean;
}

/**
 * Table cell node schemas - table cells and headers
 */
export interface TableCellNodeAttrs {
  colspan?: number;
  rowspan?: number;
  colwidth?: number[];
  background?: string;
}

/**
 * Unified node attributes union type
 * Used for type-safe node attribute handling
 */
export type NodeAttributes =
  | MediaNodeAttrs
  | MathNodeAttrs
  | CodeBlockNodeAttrs
  | TableCellNodeAttrs;

/**
 * Supported code languages for highlighting and serialization
 */
export interface CodeLanguage {
  id: string;
  label: string;
}

/**
 * Math symbol data structure
 */
export interface MathSymbol {
  symbol: string;
  latex: string;
  category?: string;
}

/**
 * Math symbol category data structure
 */
export interface MathCategory {
  name: string;
  symbols: MathSymbol[];
}

/**
 * Floating toolbar positioning information
 */
export interface FloatingPosition {
  top: number;
  left: number;
  right?: number;
  bottom?: number;
}

/**
 * Editor state derived metrics
 */
export interface EditorMetrics {
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
}

/**
 * Rich text field configuration
 */
export interface RichTextFieldConfig {
  name: string;
  label: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}

/**
 * Node view component base props
 * Standard interface for all custom Tiptap node views
 */
export interface NodeViewComponentProps {
  node: any;
  updateAttributes: (attrs: Record<string, any>) => void;
  deleteNode: () => void;
  selected: boolean;
  editor: any;
  getPos: () => number;
}

/**
 * Portal UI component base props
 * Standard interface for portal-rendered floating UIs
 */
export interface FloatingPanelProps {
  position: FloatingPosition;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;
}

/**
 * Toolbar button variants
 */
export type ToolbarButtonVariant = 'toolbar' | 'menu' | 'ghost';

/**
 * Toolbar button configuration
 */
export interface ToolbarButtonProps {
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  title: string;
  variant?: ToolbarButtonVariant;
  disabled?: boolean;
  className?: string;
}

/**
 * Status badge states
 */
export type StatusBadgeState = 'unsaved' | 'saving' | 'saved';

/**
 * Status badge configuration
 */
export interface StatusBadgeProps {
  status: StatusBadgeState;
  label?: string;
  className?: string;
}

/**
 * Alt text editor configuration
 */
export interface AltTextEditorConfig {
  altDict?: Record<string, string>;
  activeLanguage?: string;
  defaultLanguage?: string;
  onSave: (alt: string) => void;
  onCancel: () => void;
}

/**
 * Serialization validation result
 */
export interface SerializationResult {
  isValid: boolean;
  html: string;
  errors: string[];
}

/**
 * Extension module namespace for organizing exported types
 */
export namespace Extensions {
  export type MediaAttributes = MediaNodeAttrs;
  export type MathAttributes = MathNodeAttrs;
  export type CodeBlockAttributes = CodeBlockNodeAttrs;
  export type TableCellAttributes = TableCellNodeAttrs;
}

/**
 * Shared utility for validating node attributes at runtime
 */
export function validateNodeAttributes(
  attrs: unknown,
  schema: Record<string, AttributeSpec>
): attrs is Record<string, any> {
  if (typeof attrs !== 'object' || attrs === null) {
    return false;
  }
  
  const record = attrs as Record<string, any>;
  
  // Validate that all required attributes are present
  for (const [key, spec] of Object.entries(schema)) {
    if (spec.default === undefined && !(key in record)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Safe attribute getter with type narrowing
 */
export function getNodeAttribute<T = any>(
  attrs: Record<string, any>,
  key: string,
  defaultValue?: T
): T | undefined {
  const value = attrs[key];
  return value !== undefined ? value : defaultValue;
}
