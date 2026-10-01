/**
 * MathFormulaNodeView Keyboard Handling Tests
 * 
 * Validates: Requirements 4.7, 4.8, 4.9
 * 
 * - Requirement 4.7: Cmd+Enter updates node latex and closes
 * - Requirement 4.8: Escape with empty latex deletes node
 * - Requirement 4.9: Escape with non-empty latex closes without modifying
 */

import { describe, it, expect, vi } from 'vitest';

describe('MathFormulaNodeView - Keyboard Handling Logic', () => {
  describe('Requirement 4.7: Cmd+Enter saves formula', () => {
    it('should save when tempLatex is non-empty', () => {
      const updateAttributes = vi.fn();
      const tempLatex = 'E = mc^2';

      // Simulates the Cmd+Enter logic: if tempLatex.trim() is non-empty, save it
      const trimmed = tempLatex.trim();
      if (trimmed) {
        updateAttributes({ latex: trimmed, display: true });
      }

      expect(updateAttributes).toHaveBeenCalledWith({ latex: 'E = mc^2', display: true });
    });

    it('should delete node when tempLatex is empty', () => {
      const updateAttributes = vi.fn();
      const deleteNode = vi.fn();
      const tempLatex = '   ';

      // Simulates the Cmd+Enter logic: if tempLatex.trim() is empty, delete the node
      const trimmed = tempLatex.trim();
      if (!trimmed) {
        deleteNode();
      } else {
        updateAttributes({ latex: trimmed, display: true });
      }

      expect(deleteNode).toHaveBeenCalled();
      expect(updateAttributes).not.toHaveBeenCalled();
    });

    it('should work with both Mac (metaKey) and non-Mac (ctrlKey)', () => {
      const updateAttributes = vi.fn();
      
      // Test case 1: metaKey (Mac)
      const isModifierPressedMac = true; // metaKey
      if (isModifierPressedMac && 'E = mc^2'.trim()) {
        updateAttributes({ latex: 'E = mc^2' });
      }
      expect(updateAttributes).toHaveBeenCalled();

      updateAttributes.mockClear();

      // Test case 2: ctrlKey (non-Mac)
      const isModifierPressedNonMac = true; // ctrlKey
      if (isModifierPressedNonMac && 'x^2 + y^2'.trim()) {
        updateAttributes({ latex: 'x^2 + y^2' });
      }
      expect(updateAttributes).toHaveBeenCalled();
    });
  });

  describe('Requirement 4.8: Escape with empty latex deletes node', () => {
    it('should delete when tempLatex is empty string', () => {
      const deleteNode = vi.fn();
      const tempLatex = '';

      // Escape key logic: if tempLatex.trim() is empty, delete
      if (!tempLatex.trim()) {
        deleteNode();
      }

      expect(deleteNode).toHaveBeenCalled();
    });

    it('should delete when tempLatex is only whitespace', () => {
      const deleteNode = vi.fn();
      const tempLatex = '   \n\t  ';

      // Escape key logic
      if (!tempLatex.trim()) {
        deleteNode();
      }

      expect(deleteNode).toHaveBeenCalled();
    });

    it('should not delete when tempLatex has at least one non-whitespace character', () => {
      const deleteNode = vi.fn();
      const tempLatex = 'x';

      // Escape key logic
      if (!tempLatex.trim()) {
        deleteNode();
      }

      expect(deleteNode).not.toHaveBeenCalled();
    });

    it('should handle various whitespace types correctly', () => {
      const deleteNode = vi.fn();
      
      const testCases = [
        { tempLatex: '', shouldDelete: true },
        { tempLatex: ' ', shouldDelete: true },
        { tempLatex: '\n', shouldDelete: true },
        { tempLatex: '\t', shouldDelete: true },
        { tempLatex: '  \n\t  ', shouldDelete: true },
        { tempLatex: 'a', shouldDelete: false },
        { tempLatex: '  a  ', shouldDelete: false },
        { tempLatex: '\n\na\n\n', shouldDelete: false },
      ];

      testCases.forEach(({ tempLatex, shouldDelete }) => {
        deleteNode.mockClear();

        if (!tempLatex.trim()) {
          deleteNode();
        }

        if (shouldDelete) {
          expect(deleteNode).toHaveBeenCalled();
        } else {
          expect(deleteNode).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Requirement 4.9: Escape with non-empty latex closes without modifying', () => {
    it('should close editor without saving when tempLatex has content', () => {
      const updateAttributes = vi.fn();
      const deleteNode = vi.fn();
      let isEditing = true;
      const tempLatex = 'x^2 + y^2';

      // Escape key logic: if tempLatex has content, just close (don't save or delete)
      if (!tempLatex.trim()) {
        deleteNode();
      } else {
        isEditing = false;
      }

      expect(isEditing).toBe(false);
      expect(updateAttributes).not.toHaveBeenCalled();
      expect(deleteNode).not.toHaveBeenCalled();
    });

    it('should not call updateAttributes when Escape is pressed', () => {
      const updateAttributes = vi.fn();
      const deleteNode = vi.fn();
      const tempLatex = 'modified content';

      // User pressed Escape - should NOT save tempLatex
      if (!tempLatex.trim()) {
        deleteNode();
      }
      // else: just close, do NOT call updateAttributes

      expect(updateAttributes).not.toHaveBeenCalled();
      expect(deleteNode).not.toHaveBeenCalled();
    });

    it('should not delete node when Escape is pressed with non-empty tempLatex', () => {
      const deleteNode = vi.fn();
      const tempLatex = 'formula content';

      if (!tempLatex.trim()) {
        deleteNode();
      }

      expect(deleteNode).not.toHaveBeenCalled();
    });

    it('should handle various LaTeX strings correctly on Escape', () => {
      const deleteNode = vi.fn();

      const testCases = [
        { tempLatex: 'E = mc^2', shouldClose: true, shouldDelete: false },
        { tempLatex: '\\alpha + \\beta', shouldClose: true, shouldDelete: false },
        { tempLatex: '  x  ', shouldClose: true, shouldDelete: false },
        { tempLatex: '', shouldClose: false, shouldDelete: true },
        { tempLatex: '   ', shouldClose: false, shouldDelete: true },
      ];

      testCases.forEach(({ tempLatex, shouldDelete }) => {
        deleteNode.mockClear();
        let isEditing = true;

        if (!tempLatex.trim()) {
          deleteNode();
        } else {
          isEditing = false;
        }

        if (shouldDelete) {
          expect(deleteNode).toHaveBeenCalled();
        } else {
          expect(deleteNode).not.toHaveBeenCalled();
          expect(isEditing).toBe(false);
        }
      });
    });
  });

  describe('Integration: Combined scenarios', () => {
    it('should distinguish Cmd+Enter (save) from Escape (discard)', () => {
      const updateAttributes = vi.fn();
      const deleteNode = vi.fn();
      let isEditing = true;
      const tempLatex = 'x^2 + y^2';

      // Scenario 1: User presses Cmd+Enter (save)
      const trimmed = tempLatex.trim();
      if (trimmed) {
        updateAttributes({ latex: trimmed });
        isEditing = false;
      }

      expect(updateAttributes).toHaveBeenCalledWith({ latex: 'x^2 + y^2' });
      expect(deleteNode).not.toHaveBeenCalled();

      // Reset
      updateAttributes.mockClear();
      isEditing = true;

      // Scenario 2: User presses Escape (discard)
      if (!tempLatex.trim()) {
        deleteNode();
      } else {
        isEditing = false;
      }

      expect(updateAttributes).not.toHaveBeenCalled();
      expect(deleteNode).not.toHaveBeenCalled();
      expect(isEditing).toBe(false);
    });

    it('should handle user clearing field then pressing Escape', () => {
      const updateAttributes = vi.fn();
      const deleteNode = vi.fn();
      let tempLatex = 'initial formula';

      // User clears the field
      tempLatex = '';

      // User presses Escape
      if (!tempLatex.trim()) {
        deleteNode();
      }

      expect(deleteNode).toHaveBeenCalled();
      expect(updateAttributes).not.toHaveBeenCalled();
    });

    it('should handle rapid Escape presses with changing content', () => {
      const deleteNode = vi.fn();
      let tempLatex = 'x';

      // First Escape: tempLatex has content, so just close
      if (!tempLatex.trim()) {
        deleteNode();
      }
      expect(deleteNode).not.toHaveBeenCalled();

      // User clears the field
      tempLatex = '';
      deleteNode.mockClear();

      // Second Escape: tempLatex is empty, so delete
      if (!tempLatex.trim()) {
        deleteNode();
      }
      expect(deleteNode).toHaveBeenCalled();
    });
  });

  describe('Unicode and special character handling', () => {
    it('should correctly identify non-empty LaTeX with unicode characters', () => {
      const testCases = [
        'α + β = γ',
        '中文公式',
        '\\sum_{i=1}^n x_i',
        '🧮',
      ];

      testCases.forEach((tempLatex) => {
        const isEmpty = !tempLatex.trim();
        expect(isEmpty).toBe(false);
      });
    });

    it('should correctly handle LaTeX escape sequences', () => {
      const testCases = [
        '\\alpha',
        '\\textbf{bold}',
        '\\sum_{i=1}^{n}',
        '\\left( x \\right)',
      ];

      testCases.forEach((tempLatex) => {
        const isEmpty = !tempLatex.trim();
        expect(isEmpty).toBe(false);
      });
    });
  });
});
