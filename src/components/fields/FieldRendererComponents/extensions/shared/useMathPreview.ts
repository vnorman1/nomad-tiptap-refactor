/**
 * useMathPreview Hook
 *
 * Generates KaTeX HTML preview from LaTeX input with error handling
 *
 * This hook is used by MathFormulaNodeView and InlineMathNodeView to render
 * live previews of LaTeX formulas. It handles both display mode and inline mode,
 * with graceful error handling and fallback rendering.
 *
 * Validates: Requirement 4.3 - Math preview generation using KaTeX
 * Property 4: Math Preview Updates Respond to LaTeX Input Changes
 */

import { useMemo } from 'react';
import katex from 'katex';

/**
 * Result of KaTeX preview rendering
 */
export interface MathPreviewResult {
  /** Rendered HTML string from KaTeX */
  previewHtml: string;
  /** Whether an error occurred during rendering */
  hasError: boolean;
  /** Error message if rendering failed, empty string otherwise */
  errorMessage: string;
}

/**
 * Options for math preview rendering
 */
export interface UseMathPreviewOptions {
  /** LaTeX string to render */
  latex?: string | null;
  /** Display mode (true for block, false for inline) */
  displayMode?: boolean;
}

/**
 * Core logic for generating KaTeX HTML preview
 * Exported separately to enable testing without React
 *
 * @param options - Configuration object with latex and displayMode
 * @returns Object containing previewHtml, hasError flag, and errorMessage
 *
 * @internal Used by useMathPreview and for testing
 */
export function renderMathPreview(
  options: UseMathPreviewOptions = {}
): MathPreviewResult {
  const { latex = '', displayMode = false } = options;

  // If latex is empty or whitespace-only, return empty preview
  if (!latex || typeof latex !== 'string' || !latex.trim()) {
    return {
      previewHtml: '',
      hasError: false,
      errorMessage: '',
    };
  }

  try {
    // First attempt: strict parsing with throwOnError: true
    const html = katex.renderToString(latex, {
      displayMode,
      output: 'html',
      throwOnError: true,
    });

    return {
      previewHtml: html,
      hasError: false,
      errorMessage: '',
    };
  } catch (err: any) {
    // Second attempt: fallback with throwOnError: false to show partial rendering
    try {
      const fallbackHtml = katex.renderToString(latex, {
        displayMode,
        output: 'html',
        throwOnError: false,
      });

      return {
        previewHtml: fallbackHtml,
        hasError: true,
        errorMessage: err?.message || 'LaTeX syntax error',
      };
    } catch {
      // If even the fallback fails, return empty with error
      return {
        previewHtml: '',
        hasError: true,
        errorMessage: err?.message || 'Failed to render LaTeX',
      };
    }
  }
}

/**
 * Generates KaTeX HTML preview from LaTeX input
 *
 * @param latex - LaTeX string to render
 * @param displayMode - Whether to use display mode (true) or inline mode (false)
 * @returns Object containing previewHtml, hasError flag, and errorMessage
 *
 * @example
 * const { previewHtml, hasError } = useMathPreview('x^2 + y^2 = z^2', false);
 * // previewHtml = '<span class="katex">...</span>'
 * // hasError = false
 *
 * @example
 * const { previewHtml, hasError, errorMessage } = useMathPreview('x^', false);
 * // previewHtml = '<span class="katex-error">...</span>' (fallback rendering)
 * // hasError = true
 * // errorMessage = 'Expected \'}\', got end of input at position 2'
 */
export function useMathPreview(
  latex?: string | null,
  displayMode: boolean = false
): MathPreviewResult {
  return useMemo(
    () =>
      renderMathPreview({
        latex,
        displayMode,
      }),
    [latex, displayMode]
  );
}

export default useMathPreview;
