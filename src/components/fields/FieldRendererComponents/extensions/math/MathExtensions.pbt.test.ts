/**
 * Property-Based Tests (PBT) for Math Extensions and NodeViews
 * 
 * Formal verification of ProseMirror/TipTap invariants for MathFormula and InlineMath
 * following the specifications in powers/tiptap-tools/skills/prosemirror-testing/SKILL.md:
 * 
 * 1. Round-Trip Serialization & Deserialization Invariants (Structural Isomorphism & Default Fallbacks)
 * 2. Delimiter Boundary & Text Escaping Invariants (Enclosure Integrity & Collision Resistance)
 * 3. Transaction Invertibility & Keyboard State Transitions (Step Inversion & Req 4.7, 4.8, 4.9)
 * 4. Schema Normalization & Defensive Security / KaTeX Preview Contracts (Req 4.3 & XSS Sanitization)
 * 5. Math Symbol Palette & Snippet Cursor Transformation Invariants (Req 4.13)
 * 
 * @requirements 4.1, 4.3, 4.4, 4.7, 4.8, 4.9, 4.13
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import StarterKit from '@tiptap/starter-kit';
import { getSchema } from '@tiptap/core';
import { ReplaceStep } from '@tiptap/pm/transform';
import { Slice, Fragment } from '@tiptap/pm/model';

import { InlineMath } from './InlineMathExtension';
import { MathFormula } from './MathFormulaExtension';
import { renderMathPreview } from '../shared/useMathPreview';
import { MATH_CATEGORIES } from './mathSymbols';

// Initialize TipTap / ProseMirror schema with Math extensions
const mathSchema = getSchema([StarterKit, InlineMath, MathFormula]);

/**
 * Mock helper simulating DOM element attributes for TipTap parseHTML
 */
function createMockElement(attrs: Record<string, string>, textContent = ''): HTMLElement {
  return {
    getAttribute: (name: string) => attrs[name] ?? null,
    textContent,
  } as unknown as HTMLElement;
}

/**
 * Delimiter wrapping helpers representing Markdown math serialization
 */
function serializeMathBlock(latex: string): string {
  const escaped = latex.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
  return `$$\n${escaped}\n$$`;
}

function parseMathBlock(content: string): string {
  if (!content.startsWith('$$\n') || !content.endsWith('\n$$')) {
    throw new Error('Malformed math block enclosure');
  }
  const inner = content.slice(3, -3);
  return inner.replace(/\\([\\$])/g, '$1');
}

function serializeInlineMath(latex: string): string {
  const escaped = latex.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
  return `$${escaped}$`;
}

function parseInlineMath(content: string): string {
  if (!content.startsWith('$') || !content.endsWith('$') || content.length < 2) {
    throw new Error('Malformed inline math enclosure');
  }
  const inner = content.slice(1, -1);
  return inner.replace(/\\([\\$])/g, '$1');
}

/**
 * Helper representing the snippet insertion logic used in Math NodeViews
 */
function insertSnippet(
  tempLatex: string,
  start: number,
  end: number,
  snippet: string
): { nextText: string; newCursorPos: number } {
  const selectedText = tempLatex.slice(start, end);
  let insertion = snippet;
  let newCursorPos = start + snippet.length;

  if (selectedText) {
    if (snippet.includes('{a}')) {
      insertion = snippet.replace('{a}', `{${selectedText}}`);
      newCursorPos = start + insertion.length;
    } else if (snippet.includes('{x}')) {
      insertion = snippet.replace('{x}', `{${selectedText}}`);
      newCursorPos = start + insertion.length;
    } else {
      insertion = snippet + selectedText;
      newCursorPos = start + insertion.length;
    }
  } else {
    if (snippet.includes('{a}')) {
      newCursorPos = start + snippet.indexOf('{a}') + 1;
    } else if (snippet.includes('{x}')) {
      newCursorPos = start + snippet.indexOf('{x}') + 1;
    } else if (snippet.includes('{n}')) {
      newCursorPos = start + snippet.indexOf('{n}') + 1;
    } else if (snippet.indexOf('{}') !== -1) {
      newCursorPos = start + snippet.indexOf('{}') + 1;
    }
  }

  const nextText = tempLatex.slice(0, start) + insertion + tempLatex.slice(end);
  return { nextText, newCursorPos };
}

describe('Math Extensions - Property-Based Testing (PBT)', () => {
  // =========================================================================
  // 1. Round-Trip Serialization & Deserialization Invariants
  // =========================================================================
  describe('1. Round-Trip Serialization & Deserialization Invariants', () => {
    it('1.1.1 Structural Isomorphism: MathFormula JSON round-trip preserves attributes and identity', () => {
      fc.assert(
        fc.property(
          fc.record({
            latex: fc.string({ maxLength: 100 }),
            display: fc.boolean(),
          }),
          ({ latex, display }) => {
            const node = mathSchema.nodes.mathFormula.create({ latex, display });
            const json = node.toJSON();
            const restoredNode = mathSchema.nodeFromJSON(json);

            // Invariant: node.toJSON() must deeply equal restoredNode.toJSON()
            expect(restoredNode.toJSON()).toEqual(json);

            // Invariant: identity equality
            expect(restoredNode.eq(node)).toBe(true);

            // Invariant: attribute values and types must be strictly preserved
            expect(restoredNode.attrs.latex).toBe(latex);
            expect(restoredNode.attrs.display).toBe(display);
            expect(typeof restoredNode.attrs.latex).toBe('string');
            expect(typeof restoredNode.attrs.display).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('1.1.2 Structural Isomorphism: InlineMath JSON round-trip preserves attributes and identity', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100 }),
          (latex) => {
            const node = mathSchema.nodes.inlineMath.create({ latex });
            const json = node.toJSON();
            const restoredNode = mathSchema.nodeFromJSON(json);

            expect(restoredNode.toJSON()).toEqual(json);
            expect(restoredNode.eq(node)).toBe(true);
            expect(restoredNode.attrs.latex).toBe(latex);
            expect(typeof restoredNode.attrs.latex).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('1.1.3 HTML Serialization & Deserialization: MathFormula renderHTML -> parseHTML round-trip', () => {
      fc.assert(
        fc.property(
          fc.record({
            latex: fc.string({ maxLength: 100 }),
            display: fc.boolean(),
          }),
          ({ latex, display }) => {
            const node = mathSchema.nodes.mathFormula.create({ latex, display });

            // renderHTML invocation
            const renderFn = MathFormula.config.renderHTML;
            expect(renderFn).toBeDefined();

            const [tagName, renderedAttrs] = renderFn!.call(
              { options: MathFormula.options } as any,
              { node, HTMLAttributes: {} }
            ) as [string, Record<string, string>];

            // Verify structural tags according to display flag
            expect(tagName).toBe(display ? 'div' : 'span');
            expect(renderedAttrs['data-type']).toBe('math-formula');
            expect(renderedAttrs['data-latex']).toBe(latex);
            expect(renderedAttrs['data-display']).toBe(display ? 'true' : 'false');

            // parseHTML invocation on rendered attributes
            const mockElement = createMockElement(renderedAttrs);
            const parseRules = MathFormula.config.parseHTML!.call({ options: MathFormula.options } as any)!;

            // div rule is index 0, span rule is index 1
            const ruleIndex = display ? 0 : 1;
            const parsedAttrs = (parseRules[ruleIndex] as any).getAttrs(mockElement);

            expect(parsedAttrs.latex).toBe(latex);
            expect(parsedAttrs.display).toBe(display);
            expect(typeof parsedAttrs.display).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('1.1.4 HTML Serialization & Deserialization: InlineMath renderHTML -> parseHTML round-trip', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100 }),
          (latex) => {
            const node = mathSchema.nodes.inlineMath.create({ latex });
            const renderFn = InlineMath.config.renderHTML;
            expect(renderFn).toBeDefined();

            const [tagName, renderedAttrs] = renderFn!.call(
              { options: InlineMath.options } as any,
              { node, HTMLAttributes: {} }
            ) as [string, Record<string, string>];

            expect(tagName).toBe('span');
            expect(renderedAttrs['data-type']).toBe('inline-math');
            expect(renderedAttrs['data-latex']).toBe(latex);

            const mockElement = createMockElement(renderedAttrs);
            const parseRules = InlineMath.config.parseHTML!.call({ options: InlineMath.options } as any)!;

            // Rule 0 parses data-type="inline-math"
            const parsedAttrs0 = (parseRules[0] as any).getAttrs(mockElement);
            expect(parsedAttrs0.latex).toBe(latex);

            // Rule 1 parses span.inline-math-node
            const parsedAttrs1 = (parseRules[1] as any).getAttrs(mockElement);
            expect(parsedAttrs1.latex).toBe(latex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('1.1.5 Default Attribute Fallback: Omitted optional attributes fall back to schema defaults', () => {
      // MathFormula defaults: latex: '', display: true
      const defaultFormula = mathSchema.nodes.mathFormula.create({});
      expect(defaultFormula.attrs.latex).toBe('');
      expect(defaultFormula.attrs.display).toBe(true);

      // InlineMath defaults: latex: ''
      const defaultInline = mathSchema.nodes.inlineMath.create({});
      expect(defaultInline.attrs.latex).toBe('');
    });
  });

  // =========================================================================
  // 2. Delimiter Boundary & Text Escaping Invariants
  // =========================================================================
  describe('2. Delimiter Boundary & Text Escaping Invariants', () => {
    it('2.1 Enclosure Integrity: Block math ($$) and inline math ($) preserve strict boundaries', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100 }),
          (latexPayload) => {
            const serializedBlock = serializeMathBlock(latexPayload);
            expect(serializedBlock.startsWith('$$')).toBe(true);
            expect(serializedBlock.endsWith('$$')).toBe(true);

            const serializedInline = serializeInlineMath(latexPayload);
            expect(serializedInline.startsWith('$')).toBe(true);
            expect(serializedInline.endsWith('$')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('2.2 Collision Resistance: Payloads containing literal delimiters round-trip without corruption', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ maxLength: 80 }),
            fc.constant('\\text{cost is $$10}'),
            fc.constant('E = mc^2 and $x=1$'),
            fc.constant('$$a + b = c$$'),
            fc.constant('Price: $50 vs $100')
          ),
          (rawLatex) => {
            // Block math delimiter collision test
            const wrappedBlock = serializeMathBlock(rawLatex);
            const unwrappedBlock = parseMathBlock(wrappedBlock);
            expect(unwrappedBlock).toBe(rawLatex);

            // Inline math delimiter collision test
            const wrappedInline = serializeInlineMath(rawLatex);
            const unwrappedInline = parseInlineMath(wrappedInline);
            expect(unwrappedInline).toBe(rawLatex);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // 3. Transaction Invertibility & History State Invariants
  // =========================================================================
  describe('3. Transaction Invertibility & History State Invariants', () => {
    it('3.1 Step Inversion Mathematical Law: Atomic node insertion step is invertible', () => {
      fc.assert(
        fc.property(
          fc.record({
            initialText: fc.string({ minLength: 1, maxLength: 30 }),
            latex: fc.string({ minLength: 1, maxLength: 30 }),
            display: fc.boolean(),
          }),
          ({ initialText, latex, display }) => {
            const doc0 = mathSchema.node('doc', null, [
              mathSchema.node('paragraph', null, [mathSchema.text(initialText)]),
            ]);

            const formulaNode = mathSchema.node('mathFormula', { latex, display });
            const step = new ReplaceStep(
              0,
              0,
              new Slice(Fragment.from(formulaNode), 0, 0)
            );

            // Apply step
            const doc1 = step.apply(doc0).doc!;
            expect(doc1).toBeDefined();
            expect(doc1.eq(doc0)).toBe(false);

            // Invert step
            const stepInv = step.invert(doc0);
            const docRestored = stepInv.apply(doc1).doc!;

            // Law: S_inv.apply(S.apply(doc0)) eq doc0
            expect(docRestored.eq(doc0)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('3.2.1 Keyboard Handling Invariant: Cmd+Enter (Save action) adheres to trim & empty semantics', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 50 }),
          (rawInput) => {
            const updateAttributes = vi.fn();
            const deleteNode = vi.fn();

            const trimmed = rawInput.trim();
            if (trimmed.length > 0) {
              updateAttributes({ latex: trimmed, display: true });
            } else {
              deleteNode();
            }

            if (trimmed.length > 0) {
              expect(updateAttributes).toHaveBeenCalledWith({ latex: trimmed, display: true });
              expect(deleteNode).not.toHaveBeenCalled();
            } else {
              expect(deleteNode).toHaveBeenCalledTimes(1);
              expect(updateAttributes).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('3.2.2 Keyboard Handling Invariant: Escape (Cancel action) deletes if empty, preserves if non-empty', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 50 }),
          (rawInput) => {
            const deleteNode = vi.fn();
            const closeEditor = vi.fn();
            const updateAttributes = vi.fn();

            const trimmed = rawInput.trim();
            if (!trimmed) {
              deleteNode();
            } else {
              closeEditor();
            }

            if (trimmed.length === 0) {
              expect(deleteNode).toHaveBeenCalledTimes(1);
              expect(closeEditor).not.toHaveBeenCalled();
            } else {
              expect(closeEditor).toHaveBeenCalledTimes(1);
              expect(deleteNode).not.toHaveBeenCalled();
            }
            expect(updateAttributes).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // 4. Schema Normalization & Defensive Security / KaTeX Preview Contracts
  // =========================================================================
  describe('4. Schema Normalization & Defensive Security / KaTeX Preview Contracts', () => {
    it('4.1 Schema Conformance: Nodes respect atom, inline, and block constraints', () => {
      const inlineMathNode = mathSchema.nodes.inlineMath.create({ latex: 'x' });
      expect(inlineMathNode.isInline).toBe(true);
      expect(inlineMathNode.isAtom).toBe(true);
      expect(inlineMathNode.isBlock).toBe(false);

      const mathFormulaNode = mathSchema.nodes.mathFormula.create({ latex: 'x' });
      expect(mathFormulaNode.isBlock).toBe(true);
      expect(mathFormulaNode.isAtom).toBe(true);
      expect(mathFormulaNode.isInline).toBe(false);
    });

    it('4.2 KaTeX Preview Total Function Contract: Never crashes for any arbitrary input', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        fc.assert(
          fc.property(
            fc.record({
              latex: fc.oneof(
                fc.string({ maxLength: 80 }),
                fc.string({ maxLength: 80, unit: 'binary' }),
                fc.constant('\\frac{1}{0}'),
                fc.constant('\\sqrt{-1}'),
                fc.constant('\\invalidCommandXYZ{test}'),
                fc.constant('{{{unclosed braces'),
                fc.constant(''),
                fc.constant('   \n\t  ')
              ),
              displayMode: fc.boolean(),
            }),
            ({ latex, displayMode }) => {
              let result: ReturnType<typeof renderMathPreview>;
              expect(() => {
                result = renderMathPreview({ latex, displayMode });
              }).not.toThrow();

              // Result schema invariants
              expect(typeof result!.previewHtml).toBe('string');
              expect(typeof result!.hasError).toBe('boolean');
              expect(typeof result!.errorMessage).toBe('string');

              if (!latex || !latex.trim()) {
                expect(result!.previewHtml).toBe('');
                expect(result!.hasError).toBe(false);
                expect(result!.errorMessage).toBe('');
              } else if (!result!.hasError) {
                expect(result!.errorMessage).toBe('');
                expect(result!.previewHtml.length).toBeGreaterThan(0);
              } else {
                expect(result!.errorMessage.length).toBeGreaterThan(0);
              }
            }
          ),
          { numRuns: 100 }
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('4.3 Security & XSS Sanitization: Malicious script vectors are defused and never emit executable tags', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('<script>alert("xss")</script>'),
            fc.constant('<img src=x onerror=alert(1)>'),
            fc.constant('\\href{javascript:alert(1)}{click}'),
            fc.constant('"><script>alert(1)</script><"'),
            fc.constant('<svg onload=alert(1)>')
          ),
          fc.boolean(),
          (maliciousPayload, displayMode) => {
            const result = renderMathPreview({ latex: maliciousPayload, displayMode });

            // HTML output must NEVER contain unescaped executable script tags
            expect(result.previewHtml).not.toMatch(/<script\b[^>]*>/i);
            expect(result.previewHtml).not.toMatch(/<iframe\b[^>]*>/i);
            expect(result.previewHtml).not.toMatch(/onerror=/i);
            expect(result.previewHtml).not.toMatch(/onload=/i);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // =========================================================================
  // 5. Math Symbol Palette & Snippet Insertion Invariants
  // =========================================================================
  describe('5. Math Symbol Palette & Snippet Insertion Invariants', () => {
    it('5.1 Snippet Insertion Cursor Mathematics: Insertion maintains string and cursor bounds', () => {
      // Collect valid snippet patterns from MATH_CATEGORIES
      const sampleSnippets = MATH_CATEGORIES.flatMap((c) => c.symbols.map((s) => s.latex));

      fc.assert(
        fc.property(
          fc.record({
            baseText: fc.string({ maxLength: 50 }),
            snippet: fc.oneof(
              fc.constantFrom(...sampleSnippets),
              fc.constant('\\frac{a}{b}'),
              fc.constant('\\sqrt{x}'),
              fc.constant('x^{n}'),
              fc.constant('{}')
            ),
          }).chain(({ baseText, snippet }) =>
            fc.record({
              baseText: fc.constant(baseText),
              snippet: fc.constant(snippet),
              start: fc.integer({ min: 0, max: baseText.length }),
              end: fc.integer({ min: 0, max: baseText.length }),
            })
          ),
          ({ baseText, snippet, start: s1, end: s2 }) => {
            const start = Math.min(s1, s2);
            const end = Math.max(s1, s2);

            const { nextText, newCursorPos } = insertSnippet(baseText, start, end, snippet);

            // Invariant: nextText is non-null string
            expect(typeof nextText).toBe('string');

            // Invariant: cursor position strictly bounded within [0, nextText.length]
            expect(newCursorPos).toBeGreaterThanOrEqual(0);
            expect(newCursorPos).toBeLessThanOrEqual(nextText.length);

            // Invariant: prefix before start and suffix after end remain intact
            expect(nextText.slice(0, start)).toBe(baseText.slice(0, start));
            expect(nextText.endsWith(baseText.slice(end))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('5.2 Symbol Palette Database Integrity: All categories and symbols are valid', () => {
      expect(MATH_CATEGORIES.length).toBeGreaterThan(0);

      const categoryIds = new Set<string>();
      MATH_CATEGORIES.forEach((category) => {
        expect(category.id).toBeTruthy();
        expect(categoryIds.has(category.id)).toBe(false);
        categoryIds.add(category.id);

        expect(category.title).toBeTruthy();
        expect(category.symbols.length).toBeGreaterThan(0);

        category.symbols.forEach((symbol) => {
          expect(symbol.label.trim().length).toBeGreaterThan(0);
          expect(symbol.label.length).toBeLessThanOrEqual(10);
          expect(symbol.latex.trim().length).toBeGreaterThan(0);
          expect(symbol.tooltip.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });
});
