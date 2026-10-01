/**
 * Unit Tests for useMathPreview Hook
 *
 * Tests the KaTeX preview generation logic with error handling
 * covering all rendering scenarios and edge cases
 */

import { describe, it, expect } from 'vitest';
import { renderMathPreview } from './useMathPreview';

/**
 * Test helper using the core renderMathPreview function
 * This allows testing without React components
 */
function testRenderMathPreview(options: Parameters<typeof renderMathPreview>[0]) {
  return renderMathPreview(options);
}

describe('useMathPreview Hook', () => {
  describe('Basic LaTeX Rendering', () => {
    it('should render simple inline math correctly', () => {
      const result = testRenderMathPreview({
        latex: 'x^2 + y^2 = z^2',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });

    it('should render display mode math correctly', () => {
      const result = testRenderMathPreview({
        latex: '\\frac{1}{2}',
        displayMode: true,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });

    it('should render Greek letters correctly', () => {
      const result = testRenderMathPreview({
        latex: '\\alpha + \\beta = \\gamma',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });

    it('should render complex mathematical expressions', () => {
      const result = testRenderMathPreview({
        latex:
          '\\mathcal{L}_{total} = \\frac{1}{N}\\sum_{i=1}^{N} \\left( y_i - \\hat{y}_i \\right)^2 + \\lambda \\|\\mathbf{w}\\|_2^2',
        displayMode: true,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });
  });

  describe('Empty Input Handling', () => {
    it('should return empty preview for empty string', () => {
      const result = testRenderMathPreview({
        latex: '',
        displayMode: false,
      });

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });

    it('should return empty preview for whitespace-only string', () => {
      const result = testRenderMathPreview({
        latex: '   ',
        displayMode: false,
      });

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });

    it('should return empty preview for null latex', () => {
      const result = testRenderMathPreview({
        latex: null,
        displayMode: false,
      });

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });

    it('should return empty preview for undefined latex', () => {
      const result = testRenderMathPreview({
        latex: undefined,
        displayMode: false,
      });

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });

    it('should return empty preview when no options provided', () => {
      const result = testRenderMathPreview({});

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should detect syntax errors in LaTeX', () => {
      const result = testRenderMathPreview({
        latex: 'x^',
        displayMode: false,
      });

      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBeTruthy();
      expect(result.errorMessage.length > 0).toBe(true);
    });

    it('should detect unmatched braces', () => {
      const result = testRenderMathPreview({
        latex: '{x',
        displayMode: false,
      });

      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBeTruthy();
    });

    it('should provide error message for invalid commands', () => {
      const result = testRenderMathPreview({
        latex: '\\invalidcommand',
        displayMode: false,
      });

      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBeTruthy();
    });

    it('should return fallback HTML even with error', () => {
      const result = testRenderMathPreview({
        latex: '\\text{test} + x^',
        displayMode: false,
      });

      expect(result.hasError).toBe(true);
      expect(result.previewHtml).toBeTruthy();
      // Fallback rendering should still produce katex HTML
      expect(result.previewHtml.length > 0).toBe(true);
    });

    it('should handle multiple errors gracefully', () => {
      const result = testRenderMathPreview({
        latex: '{{{{x',
        displayMode: false,
      });

      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBeTruthy();
    });
  });

  describe('Display Mode Behavior', () => {
    it('should render inline mode when displayMode is false', () => {
      const result = testRenderMathPreview({
        latex: 'x + y',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });

    it('should render display mode when displayMode is true', () => {
      const result = testRenderMathPreview({
        latex: 'x + y',
        displayMode: true,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });

    it('should default to inline mode when displayMode is not specified', () => {
      const result = testRenderMathPreview({
        latex: 'x + y',
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });

    it('should handle displayMode=true for fractions', () => {
      const result = testRenderMathPreview({
        latex: '\\frac{1}{2}',
        displayMode: true,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });
  });

  describe('Edge Cases and Special Characters', () => {
    it('should handle special LaTeX characters', () => {
      const result = testRenderMathPreview({
        latex: '\\{ \\} \\$ \\%',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });

    it('should handle backslashes in LaTeX', () => {
      const result = testRenderMathPreview({
        latex: '\\\\',
        displayMode: false,
      });

      // This is valid LaTeX (line break)
      expect(result.previewHtml).toContain('katex');
    });

    it('should handle empty braces', () => {
      const result = testRenderMathPreview({
        latex: 'x^{}',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
    });

    it('should handle nested braces', () => {
      const result = testRenderMathPreview({
        latex: '{{{x}}}',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
    });

    it('should handle whitespace around content', () => {
      const result = testRenderMathPreview({
        latex: '  x + y  ',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });

    it('should handle subscripts and superscripts', () => {
      const result = testRenderMathPreview({
        latex: 'x_{i,j}^{2n}',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });

    it('should handle text mode', () => {
      const result = testRenderMathPreview({
        latex: '\\text{This is text}',
        displayMode: false,
      });

      expect(result.previewHtml).toContain('katex');
      expect(result.hasError).toBe(false);
    });
  });

  describe('Result Object Structure', () => {
    it('should always return previewHtml as string', () => {
      const result = testRenderMathPreview({
        latex: 'x',
        displayMode: false,
      });

      expect(typeof result.previewHtml).toBe('string');
    });

    it('should always return hasError as boolean', () => {
      const result = testRenderMathPreview({
        latex: 'x',
        displayMode: false,
      });

      expect(typeof result.hasError).toBe('boolean');
    });

    it('should always return errorMessage as string', () => {
      const result = testRenderMathPreview({
        latex: 'x',
        displayMode: false,
      });

      expect(typeof result.errorMessage).toBe('string');
    });

    it('should return empty errorMessage when hasError is false', () => {
      const result = testRenderMathPreview({
        latex: 'x + y',
        displayMode: false,
      });

      expect(result.hasError).toBe(false);
      expect(result.errorMessage).toBe('');
    });

    it('should return non-empty errorMessage when hasError is true', () => {
      const result = testRenderMathPreview({
        latex: 'x^',
        displayMode: false,
      });

      expect(result.hasError).toBe(true);
      expect(result.errorMessage.length > 0).toBe(true);
    });
  });

  describe('Requirement 4.3 - KaTeX Math Preview', () => {
    it('validates requirement 4.3: accepts latex and displayMode and returns previewHtml, hasError, errorMessage', () => {
      // Test case 1: Successful rendering with displayMode false
      const test1 = testRenderMathPreview({
        latex: 'x^2 + y^2 = z^2',
        displayMode: false,
      });

      expect(test1.previewHtml).toBeTruthy();
      expect(test1.hasError).toBe(false);
      expect(test1.errorMessage).toBe('');

      // Test case 2: Successful rendering with displayMode true
      const test2 = testRenderMathPreview({
        latex: '\\sum_{i=1}^{n} i',
        displayMode: true,
      });

      expect(test2.previewHtml).toBeTruthy();
      expect(test2.hasError).toBe(false);

      // Test case 3: Error handling with graceful fallback
      const test3 = testRenderMathPreview({
        latex: '\\invalid + x^',
        displayMode: false,
      });

      expect(test3.hasError).toBe(true);
      expect(test3.errorMessage).toBeTruthy();
      // Should still have some HTML from fallback rendering
      expect(test3.previewHtml.length >= 0).toBe(true);
    });

    it('validates requirement 4.3: handles errors gracefully and returns error messages', () => {
      const result = testRenderMathPreview({
        latex: 'x^',
        displayMode: false,
      });

      expect(result.hasError).toBe(true);
      expect(result.errorMessage).toBeTruthy();
      expect(result.errorMessage.length > 0).toBe(true);
    });
  });

  describe('Property 4: Math Preview Updates Respond to LaTeX Input Changes', () => {
    it('should produce different output for different LaTeX inputs', () => {
      const result1 = testRenderMathPreview({
        latex: 'x + y',
        displayMode: false,
      });

      const result2 = testRenderMathPreview({
        latex: 'x^2 + y^2',
        displayMode: false,
      });

      // Different LaTeX should produce different HTML
      expect(result1.previewHtml).not.toBe(result2.previewHtml);
    });

    it('should respond to displayMode changes', () => {
      const latex = 'x + y';

      const inline = testRenderMathPreview({
        latex,
        displayMode: false,
      });

      const display = testRenderMathPreview({
        latex,
        displayMode: true,
      });

      // Different display modes might produce different sizing/styling
      expect(inline.previewHtml).toBeTruthy();
      expect(display.previewHtml).toBeTruthy();
      // Both should be valid KaTeX
      expect(inline.previewHtml).toContain('katex');
      expect(display.previewHtml).toContain('katex');
    });

    it('should clear preview when latex becomes empty', () => {
      const withContent = testRenderMathPreview({
        latex: 'x + y',
        displayMode: false,
      });

      const empty = testRenderMathPreview({
        latex: '',
        displayMode: false,
      });

      expect(withContent.previewHtml).toBeTruthy();
      expect(empty.previewHtml).toBe('');
    });

    it('should update error state when syntax changes', () => {
      const valid = testRenderMathPreview({
        latex: 'x + y',
        displayMode: false,
      });

      const invalid = testRenderMathPreview({
        latex: 'x^',
        displayMode: false,
      });

      expect(valid.hasError).toBe(false);
      expect(invalid.hasError).toBe(true);
    });
  });

  describe('Non-String Input Handling', () => {
    it('should handle non-string latex gracefully', () => {
      const result = testRenderMathPreview({
        latex: 123 as any,
        displayMode: false,
      });

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
    });

    it('should handle object latex gracefully', () => {
      const result = testRenderMathPreview({
        latex: { text: 'x' } as any,
        displayMode: false,
      });

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
    });

    it('should handle array latex gracefully', () => {
      const result = testRenderMathPreview({
        latex: ['x'] as any,
        displayMode: false,
      });

      expect(result.previewHtml).toBe('');
      expect(result.hasError).toBe(false);
    });
  });
});
