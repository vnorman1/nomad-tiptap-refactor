/**
 * Math extensions module barrel export
 * Exports: MathFormula, InlineMath extensions and their NodeViews
 */

// Extensions implemented in Task 4.1
export { MathFormula } from './MathFormulaExtension';
export { InlineMath } from './InlineMathExtension';

// NodeViews
// Task 4.4: MathFormulaNodeView with keyboard handling (Cmd+Enter, Escape)
export { MathFormulaNodeView } from './MathFormulaNodeView';
// Task 4.8: InlineMathNodeView with inline editor
export { InlineMathNodeView } from './InlineMathNodeView';

// Symbol data implemented in Task 4.2
export { MATH_CATEGORIES, INLINE_GREEK_SYMBOLS, INLINE_FORMAT_SYMBOLS, INLINE_OPERATOR_SYMBOLS } from './mathSymbols';
export type { MathCategory, MathSymbol } from './mathSymbols';

// Symbol palette component to be implemented in Task 4.7
export { MathSymbolPalette } from './MathSymbolPalette';
export type { MathSymbolPaletteProps } from './MathSymbolPalette';
