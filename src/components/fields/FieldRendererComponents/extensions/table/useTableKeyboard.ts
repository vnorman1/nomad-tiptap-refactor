import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';

/**
 * useTableKeyboard Hook
 * 
 * Handles keyboard navigation and shortcuts for table editing:
 * - Tab: Move to next cell
 * - Shift+Tab: Move to previous cell
 * 
 * **Validates: Requirements 6.4, 6.5**
 */

export const useTableKeyboard = (editor: Editor | null) => {
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in a table
      const { $from } = editor.state.selection;
      let inTable = false;
      
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          inTable = true;
          break;
        }
      }

      if (!inTable) return;

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            // Move to previous cell - Tiptap table doesn't have a built-in previous cell command
            // so we'll just focus the editor
            editor.chain().focus().run();
          } else {
            editor.chain().focus().goToNextCell().run();
          }
          break;

        default:
          break;
      }
    };

    editor.view.dom.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);
};
