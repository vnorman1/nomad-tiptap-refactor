import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';

/**
 * useTableActionBar Hook
 * 
 * Detects when the cursor is positioned inside a table cell and provides
 * keyboard shortcut handling for table operations.
 * 
 * **Returns:**
 * - `isInTable`: boolean indicating if cursor is inside any table cell
 * - `position`: { top, left } coordinates for action bar positioning
 * 
 * **Keyboard Shortcuts:**
 * - Alt+↑: Add row above
 * - Alt+↓: Add row below
 * - Alt+←: Add column before
 * - Alt+→: Add column after
 * - Alt+Delete: Delete row
 * - Alt+Shift+Delete: Delete column
 * - Alt+H: Toggle header row
 * - Alt+Ctrl+Delete: Delete table
 * 
 * **Validates: Requirements 6.4, 6.5**
 */

interface TableActionBarPosition {
  top: number;
  left: number;
}

export const useTableActionBar = (editor: Editor | null) => {
  const [isInTable, setIsInTable] = useState(false);
  const [position, setPosition] = useState<TableActionBarPosition>({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      // Check if cursor is in a table cell
      const { $from } = editor.state.selection;
      
      // Walk up the document tree to find if we're inside a table
      let inTable = false;
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          inTable = true;
          break;
        }
        if (node.type.name === 'table') {
          // We found the table node
          break;
        }
      }

      setIsInTable(inTable);

      // Calculate position for action bar
      if (inTable) {
        // Position relative to editor - top-left corner
        const editorRect = document.querySelector('[data-editor-root]')?.getBoundingClientRect();
        if (editorRect) {
          setPosition({
            top: editorRect.top + 8,
            left: editorRect.left + 8,
          });
        } else {
          // Fallback: position relative to cursor
          setPosition({
            top: window.innerHeight / 2 - 50,
            left: 16,
          });
        }
      }
    };

    // Listen to editor updates
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    
    // Initial check
    handleUpdate();

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInTable) return;

      // Alt + arrow keys for row/column operations
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            editor.chain().focus().addRowBefore().run();
            break;
          case 'ArrowDown':
            e.preventDefault();
            editor.chain().focus().addRowAfter().run();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            editor.chain().focus().addColumnBefore().run();
            break;
          case 'ArrowRight':
            e.preventDefault();
            editor.chain().focus().addColumnAfter().run();
            break;
          case 'Delete':
            e.preventDefault();
            editor.chain().focus().deleteRow().run();
            break;
          case 'h':
          case 'H':
            e.preventDefault();
            editor.chain().focus().toggleHeaderRow().run();
            break;
        }
      }
      // Alt + Shift + Delete for delete column
      else if (e.altKey && e.shiftKey && !e.ctrlKey && e.key === 'Delete') {
        e.preventDefault();
        editor.chain().focus().deleteColumn().run();
      }
      // Alt + Ctrl + Delete for delete table
      else if (e.altKey && e.ctrlKey && e.key === 'Delete') {
        e.preventDefault();
        if (window.confirm('Delete the entire table? This cannot be undone.')) {
          editor.chain().focus().deleteTable().run();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, isInTable]);

  return { isInTable, position };
};
