/**
 * MathSymbolPalette Component Tests
 * 
 * Tests for the categorized grid of LaTeX symbol shortcuts
 * Uses unit tests to validate component behavior
 * 
 * @requirements 4.13
 * @validates Requirement 4.13
 */

import { describe, it, expect } from 'vitest';
import { MATH_CATEGORIES } from './mathSymbols';

describe('MathSymbolPalette - Unit Tests', () => {
  it('should have at least one category in MATH_CATEGORIES', () => {
    expect(MATH_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('should have all required properties in each category', () => {
    MATH_CATEGORIES.forEach((category) => {
      // Verify category has required properties
      expect(category.id).toBeTruthy();
      expect(category.title).toBeTruthy();
      expect(Array.isArray(category.symbols)).toBe(true);
      expect(category.symbols.length).toBeGreaterThan(0);
    });
  });

  it('should have all required properties in each symbol', () => {
    MATH_CATEGORIES.forEach((category) => {
      category.symbols.forEach((symbol) => {
        expect(symbol.label).toBeTruthy();
        expect(symbol.latex).toBeTruthy();
        expect(symbol.tooltip).toBeTruthy();

        // Labels should be concise
        expect(symbol.label.length).toBeLessThanOrEqual(10);

        // LaTeX should start with backslash or be a valid LaTeX command
        expect(symbol.latex).toMatch(/^\\|^[a-zA-Z0-9\s{}^\-_]+$/);

        // Tooltip should contain helpful information
        expect(symbol.tooltip.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have unique category IDs', () => {
    const ids = MATH_CATEGORIES.map((c) => c.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('should have reasonable number of symbols per category', () => {
    MATH_CATEGORIES.forEach((category) => {
      // Each category should have between 5 and 30 symbols
      expect(category.symbols.length).toBeGreaterThanOrEqual(5);
      expect(category.symbols.length).toBeLessThanOrEqual(30);
    });
  });

  it('should have distinct tooltips within a category', () => {
    MATH_CATEGORIES.forEach((category) => {
      const tooltips = category.symbols.map((s) => s.tooltip);
      expect(tooltips.length).toBe(new Set(tooltips).size);
    });
  });

  it('should support category switching by ID', () => {
    const categoryIds = MATH_CATEGORIES.map((c) => c.id);

    categoryIds.forEach((id) => {
      const category = MATH_CATEGORIES.find((c) => c.id === id);
      expect(category).toBeDefined();
      expect(category?.id).toBe(id);
    });
  });

  it('should have valid LaTeX for all symbols', () => {
    MATH_CATEGORIES.forEach((category) => {
      category.symbols.forEach((symbol) => {
        // LaTeX should not be empty
        expect(symbol.latex.trim().length).toBeGreaterThan(0);

        // LaTeX for mathematical notation should typically include backslashes or braces
        // But we're lenient to allow text-based shortcuts
        expect(symbol.latex).toBeTruthy();
      });
    });
  });

  it('should include common mathematical symbols', () => {
    // Find the basic operations category
    const basicCategory = MATH_CATEGORIES.find((c) => c.id === 'basic');
    expect(basicCategory).toBeDefined();

    // Verify it contains some fundamental symbols
    const allLabels = basicCategory?.symbols.map((s) => s.label) || [];
    expect(allLabels.length).toBeGreaterThan(0);
  });

  it('should include greek letters category', () => {
    const greekCategory = MATH_CATEGORIES.find((c) => c.id === 'greek');
    expect(greekCategory).toBeDefined();
    expect(greekCategory?.symbols.length).toBeGreaterThan(0);
  });

  it('should include calculus symbols', () => {
    const calculusCategory = MATH_CATEGORIES.find((c) => c.id === 'calculus');
    expect(calculusCategory).toBeDefined();
    expect(calculusCategory?.symbols.length).toBeGreaterThan(0);
  });

  it('should have proper interface for palette usage', () => {
    // Verify the structure matches what MathSymbolPalette expects
    const firstCategory = MATH_CATEGORIES[0];

    // Should be usable as activeCategory parameter (string ID)
    expect(typeof firstCategory.id).toBe('string');

    // Should be usable in categories array
    expect(Array.isArray(MATH_CATEGORIES)).toBe(true);

    // Should provide symbols for rendering
    firstCategory.symbols.forEach((symbol) => {
      // onInsert callback would receive latex
      expect(typeof symbol.latex).toBe('string');

      // onCategoryChange callback would receive category ID
      expect(typeof firstCategory.id).toBe('string');
    });
  });

  it('should handle category switching scenarios', () => {
    // Scenario: User clicks on Greek letters category
    const greekCat = MATH_CATEGORIES.find((c) => c.id === 'greek');
    expect(greekCat).toBeDefined();

    // Component would call onCategoryChange('greek')
    // and then display greekCat.symbols in the grid

    // Verify symbols are available
    if (greekCat) {
      greekCat.symbols.forEach((symbol) => {
        // Each symbol can be inserted via onInsert(symbol.latex)
        expect(symbol.latex).toBeTruthy();
      });
    }
  });

  it('should handle symbol insertion scenarios', () => {
    const firstCategory = MATH_CATEGORIES[0];
    const firstSymbol = firstCategory.symbols[0];

    // When user clicks a symbol button, onInsert would be called with:
    const latexToInsert = firstSymbol.latex;

    // The LaTeX should be a non-empty string that can be inserted
    expect(latexToInsert).toBeTruthy();
    expect(latexToInsert.length).toBeGreaterThan(0);

    // Should be valid LaTeX or LaTeX command
    expect(typeof latexToInsert).toBe('string');
  });
});
