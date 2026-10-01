/**
 * MathSymbolPalette Component
 * 
 * Renders a categorized grid of LaTeX symbol shortcuts for math editing.
 * Used by both MathFormulaNodeView (block math) and InlineMathNodeView (inline math)
 * to provide quick access to common mathematical symbols and operators.
 * 
 * @requirements 4.13
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { MathCategory } from './mathSymbols';

/**
 * Props for MathSymbolPalette component
 */
export interface MathSymbolPaletteProps {
  /** Array of symbol categories to display */
  categories: MathCategory[];
  /** Currently active category ID */
  activeCategory: string;
  /** Callback when category is changed */
  onCategoryChange: (categoryId: string) => void;
  /** Callback when a symbol is inserted - receives the LaTeX string */
  onInsert: (latex: string) => void;
  /** Optional CSS class name for styling */
  className?: string;
}

/**
 * MathSymbolPalette - Grid of LaTeX symbol shortcuts organized by category
 * 
 * Features:
 * - Tab-based category navigation
 * - Grid layout of symbol buttons
 * - Visual feedback for selected symbols
 * - Tooltip display on hover
 * 
 * The palette organizes symbols into categories (basic, calculus, greek, etc.)
 * and provides quick insertion of LaTeX code when a symbol is clicked.
 */
export const MathSymbolPalette: React.FC<MathSymbolPaletteProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  onInsert,
  className = '',
}) => {
  const { t } = useTranslation();

  // Find the currently active category
  const currentCategory = categories.find((cat) => cat.id === activeCategory);

  return (
    <div
      className={`flex flex-col gap-3 p-2 ${className}`}
      data-testid="math-symbol-palette"
    >
      {/* Category Tabs */}
      <div
        className="flex flex-wrap gap-1 border-b border-border pb-2"
        role="tablist"
        aria-label={t('editor.richTextUpdate.math.symbol_categories', 'Symbol categories')}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            role="tab"
            aria-selected={activeCategory === category.id}
            aria-controls={`symbols-${category.id}`}
            onClick={() => onCategoryChange(category.id)}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-colors
              ${
                activeCategory === category.id
                  ? 'bg-foreground text-background'
                  : 'text-foreground hover:bg-muted'
              }
            `}
            title={category.title}
          >
            {category.title}
          </button>
        ))}
      </div>

      {/* Symbol Grid */}
      {currentCategory && (
        <div
          id={`symbols-${currentCategory.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentCategory.id}`}
          className="grid grid-cols-6 gap-1"
        >
          {currentCategory.symbols.map((symbol, index) => (
            <button
              key={`${currentCategory.id}-${index}`}
              onClick={() => onInsert(symbol.latex)}
              title={symbol.tooltip}
              className={`
                px-2 py-1 text-sm rounded transition-colors
                bg-card hover:bg-muted text-foreground
                border border-border hover:border-foreground
                focus:outline-none focus:ring-1 focus:ring-primary
              `}
              type="button"
              aria-label={t('editor.richTextUpdate.math.insert_symbol', 'Insert symbol', { defaultValue: `Insert ${symbol.tooltip}` })}
            >
              <span className="font-medium">{symbol.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!currentCategory && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('editor.richTextUpdate.math.no_symbols_available', 'No symbols available')}
        </div>
      )}
    </div>
  );
};

MathSymbolPalette.displayName = 'MathSymbolPalette';
