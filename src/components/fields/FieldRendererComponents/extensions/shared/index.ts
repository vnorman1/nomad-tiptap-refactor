/**
 * Shared extensions module barrel export
 * Includes toolbar components, hooks, and utilities shared across all extensions
 */

// Toolbar components
export * from './toolbar/index';

// FloatingToolbar component - floating context-aware toolbar for text selection
// Implemented in Task 7.2
export { FloatingToolbar } from './FloatingToolbar';
export type { FloatingToolbarProps } from './FloatingToolbar';

// useMediaAttributes hook - alt text resolution with language fallback
// Implemented in Task 3.5
export { useMediaAttributes, resolveMediaAttributes } from './useMediaAttributes';
export type { MediaAttributesResult, UseMediaAttributesOptions } from './useMediaAttributes';

// useMathPreview hook - KaTeX preview generation
// Implemented in Task 4.3
export { useMathPreview, renderMathPreview } from './useMathPreview';
export type { MathPreviewResult, UseMathPreviewOptions } from './useMathPreview';

// useFloatingToolbar hook - floating toolbar positioning and lifecycle
// Implemented in Task 7.1
export { useFloatingToolbar, calculateToolbarPosition } from './useFloatingToolbar';
export type { FloatingToolbarResult, UseFloatingToolbarOptions } from './useFloatingToolbar';
