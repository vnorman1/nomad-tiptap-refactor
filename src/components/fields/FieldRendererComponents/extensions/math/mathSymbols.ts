/**
 * Math symbol definitions for LaTeX editing
 * Used by MathFormulaNodeView (block math) and InlineMathNodeView (inline math)
 */

/**
 * Symbol interface for categorized math symbols
 */
export interface MathSymbol {
  symbol: string;
  latex: string;
  category?: string;
}

/**
 * Block math symbols organized by category
 * Used in MathFormulaNodeView symbol palette
 */
export interface MathCategory {
  id: string;
  title: string;
  symbols: Array<{
    label: string;
    latex: string;
    tooltip: string;
  }>;
}

/**
 * Block math symbols categorized for formula editing
 * Each category groups related mathematical symbols for quick insertion
 */
export const MATH_CATEGORIES: MathCategory[] = [
  {
    id: 'basic',
    title: 'Műveletek',
    symbols: [
      { label: 'a/b', latex: '\\frac{a}{b}', tooltip: 'Tört (\\frac{a}{b})' },
      { label: '√x', latex: '\\sqrt{x}', tooltip: 'Négyzetgyök (\\sqrt{x})' },
      { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', tooltip: 'n-edik gyök (\\sqrt[n]{x})' },
      { label: 'xⁿ', latex: 'x^{n}', tooltip: 'Felső index / hatvány (x^{n})' },
      { label: 'xᵢ', latex: 'x_{i}', tooltip: 'Alsó index (x_{i})' },
      { label: '·', latex: '\\cdot ', tooltip: 'Szorzópont (\\cdot)' },
      { label: '×', latex: '\\times ', tooltip: 'Szorzáskereszt (\\times)' },
      { label: '÷', latex: '\\div ', tooltip: 'Osztás (\\div)' },
      { label: '±', latex: '\\pm ', tooltip: 'Plusz-mínusz (\\pm)' },
      { label: '∓', latex: '\\mp ', tooltip: 'Mínusz-plusz (\\mp)' },
      { label: '∞', latex: '\\infty ', tooltip: 'Végtelen (\\infty)' },
    ],
  },
  {
    id: 'calculus',
    title: 'Szumma & Kalkulus',
    symbols: [
      { label: '∑', latex: '\\sum_{t=1}^{T} ', tooltip: 'Szumma indexekkel (\\sum_{t=1}^{T})' },
      { label: '∏', latex: '\\prod_{i=1}^{n} ', tooltip: 'Produktum (\\prod_{i=1}^{n})' },
      { label: '∫', latex: '\\int_{a}^{b} f(x)\\,dx ', tooltip: 'Határozott integrál (\\int_{a}^{b})' },
      { label: '∬', latex: '\\iint ', tooltip: 'Kettős integrál (\\iint)' },
      { label: 'lim', latex: '\\lim_{x \\to \\infty} ', tooltip: 'Limesz (\\lim_{x \\to \\infty})' },
      { label: '∂', latex: '\\partial ', tooltip: 'Parciális derivált (\\partial)' },
      { label: 'df/dx', latex: '\\frac{df}{dx}', tooltip: 'Derivált tört alakban' },
      { label: 'Δ', latex: '\\Delta ', tooltip: 'Delta differencia (\\Delta)' },
      { label: '∇', latex: '\\nabla ', tooltip: 'Nabla / gradiens (\\nabla)' },
      { label: 'v⃗', latex: '\\vec{v}', tooltip: 'Vektor (\\vec{v})' },
    ],
  },
  {
    id: 'greek',
    title: 'Görög betűk',
    symbols: [
      { label: 'α', latex: '\\alpha ', tooltip: 'Alfa (\\alpha)' },
      { label: 'β', latex: '\\beta ', tooltip: 'Béta (\\beta)' },
      { label: 'γ', latex: '\\gamma ', tooltip: 'Gamma (\\gamma)' },
      { label: 'δ', latex: '\\delta ', tooltip: 'Delta (\\delta)' },
      { label: 'ε', latex: '\\epsilon ', tooltip: 'Epszilon (\\epsilon)' },
      { label: 'θ', latex: '\\theta ', tooltip: 'Téta (\\theta)' },
      { label: 'λ', latex: '\\lambda ', tooltip: 'Lambda (\\lambda)' },
      { label: 'μ', latex: '\\mu ', tooltip: 'Mü (\\mu)' },
      { label: 'π', latex: '\\pi ', tooltip: 'Pí (\\pi)' },
      { label: 'ρ', latex: '\\rho ', tooltip: 'Ró (\\rho)' },
      { label: 'σ', latex: '\\sigma ', tooltip: 'Szigma (\\sigma)' },
      { label: 'φ', latex: '\\phi ', tooltip: 'Fí (\\phi)' },
      { label: 'ω', latex: '\\omega ', tooltip: 'Omega (\\omega)' },
      { label: 'Ω', latex: '\\Omega ', tooltip: 'Nagy Omega (\\Omega)' },
    ],
  },
  {
    id: 'brackets_relations',
    title: 'Zárójelek & Relációk',
    symbols: [
      { label: '( · )', latex: '\\left( x \\right) ', tooltip: 'Dinamikus kerek zárójel' },
      { label: '[ · ]', latex: '\\left[ x \\right] ', tooltip: 'Dinamikus szögletes zárójel' },
      { label: '{ · }', latex: '\\left\\{ x \\right\\} ', tooltip: 'Dinamikus kapcsos zárójel' },
      { label: '| · |', latex: '\\left| x \\right| ', tooltip: 'Abszolút érték' },
      { label: '≤', latex: '\\le ', tooltip: 'Kisebb vagy egyenlő (\\le)' },
      { label: '≥', latex: '\\ge ', tooltip: 'Nagyobb vagy egyenlő (\\ge)' },
      { label: '≠', latex: '\\neq ', tooltip: 'Nem egyenlő (\\neq)' },
      { label: '≈', latex: '\\approx ', tooltip: 'Megközelítőleg (\\approx)' },
      { label: '→', latex: '\\rightarrow ', tooltip: 'Jobbra mutató nyíl (\\rightarrow)' },
      { label: '⇒', latex: '\\Rightarrow ', tooltip: 'Következtetés nyíl (\\Rightarrow)' },
      { label: '\\text{ }', latex: '\\text{szöveg} ', tooltip: 'Normál szöveg képletben (\\text{...})' },
      { label: 'min', latex: '\\min ', tooltip: 'Minimum (\\min)' },
      { label: 'max', latex: '\\max ', tooltip: 'Maximum (\\max)' },
    ],
  },
];

/**
 * Inline math Greek letter shortcuts
 * Quick access to common Greek letters for inline formulas
 */
export const INLINE_GREEK_SYMBOLS: MathSymbol[] = [
  { symbol: 'α', latex: '\\alpha' },
  { symbol: 'β', latex: '\\beta' },
  { symbol: 'γ', latex: '\\gamma' },
  { symbol: 'δ', latex: '\\delta' },
  { symbol: 'ε', latex: '\\epsilon' },
  { symbol: 'θ', latex: '\\theta' },
  { symbol: 'λ', latex: '\\lambda' },
  { symbol: 'μ', latex: '\\mu' },
  { symbol: 'π', latex: '\\pi' },
  { symbol: 'ρ', latex: '\\rho' },
  { symbol: 'σ', latex: '\\sigma' },
  { symbol: 'φ', latex: '\\phi' },
  { symbol: 'ω', latex: '\\omega' },
  { symbol: 'Ω', latex: '\\Omega' },
];

/**
 * Inline math formatting operators
 * Symbols for formatting and arithmetic operations
 */
export const INLINE_FORMAT_SYMBOLS: MathSymbol[] = [
  { symbol: '·', latex: '\\cdot', category: 'operators' },
  { symbol: '×', latex: '\\times', category: 'operators' },
  { symbol: '÷', latex: '\\div', category: 'operators' },
  { symbol: '±', latex: '\\pm', category: 'operators' },
  { symbol: '∓', latex: '\\mp', category: 'operators' },
  { symbol: '≤', latex: '\\le', category: 'relations' },
  { symbol: '≥', latex: '\\ge', category: 'relations' },
  { symbol: '≠', latex: '\\neq', category: 'relations' },
  { symbol: '≈', latex: '\\approx', category: 'relations' },
  { symbol: '→', latex: '\\rightarrow', category: 'arrows' },
  { symbol: '⇒', latex: '\\Rightarrow', category: 'arrows' },
];

/**
 * Inline math operator symbols
 * Advanced math operators (summation, integral, etc.)
 */
export const INLINE_OPERATOR_SYMBOLS: MathSymbol[] = [
  { symbol: '∑', latex: '\\sum', category: 'operators' },
  { symbol: '∏', latex: '\\prod', category: 'operators' },
  { symbol: '∫', latex: '\\int', category: 'calculus' },
  { symbol: '∂', latex: '\\partial', category: 'calculus' },
  { symbol: '∞', latex: '\\infty', category: 'constants' },
  { symbol: 'Δ', latex: '\\Delta', category: 'greek' },
  { symbol: '∇', latex: '\\nabla', category: 'operators' },
];
