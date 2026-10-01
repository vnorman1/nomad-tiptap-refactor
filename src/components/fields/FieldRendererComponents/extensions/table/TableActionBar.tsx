import { useTranslation } from 'react-i18next';
import {
  Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Grid
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { Toolbar_Button } from '../shared/toolbar';

/**
 * TableActionBar Component
 * 
 * Displays contextual controls when the cursor is positioned inside a table cell.
 * 
 * **Controls (in order):**
 * 1. Add row above
 * 2. Add row below
 * 3. Delete row
 * 4. Add column before
 * 5. Add column after
 * 6. Delete column
 * 7. Toggle header row
 * 8. Delete table
 * 
 * **Position:** Fixed positioning, portal-based, appears near the table
 * **Keyboard Handling:** All operations also support keyboard shortcuts
 * 
 * **Validates: Requirements 6.4, 6.5**
 */

interface TableActionBarProps {
  editor: Editor;
  position?: { top: number; left: number };
}

export const TableActionBar: React.FC<TableActionBarProps> = ({
  editor,
  position = { top: 0, left: 0 }
}) => {
  const { t } = useTranslation('editor');

  const handleAddRowAbove = () => {
    editor.chain().focus().addRowBefore().run();
  };

  const handleAddRowBelow = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const handleDeleteRow = () => {
    editor.chain().focus().deleteRow().run();
  };

  const handleAddColumnBefore = () => {
    editor.chain().focus().addColumnBefore().run();
  };

  const handleAddColumnAfter = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  const handleDeleteColumn = () => {
    editor.chain().focus().deleteColumn().run();
  };

  const handleToggleHeaderRow = () => {
    editor.chain().focus().toggleHeaderRow().run();
  };

  const handleDeleteTable = () => {
    if (window.confirm(t('editor.richTextUpdate.table.confirm_delete', 'Delete the entire table? This cannot be undone.'))) {
      editor.chain().focus().deleteTable().run();
    }
  };

  return (
    <div
      className="fixed z-50 flex flex-wrap gap-0.5 p-2 bg-background border border-border rounded-lg shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Row operations group */}
      <div className="flex gap-0.5 border-r border-border pr-0.5 mr-0.5">
        <Toolbar_Button
          icon={<ArrowUp className="w-4 h-4" />}
          onClick={handleAddRowAbove}
          title={t('editor.richTextUpdate.table.add_row_above', 'Add row above')}
          variant="ghost"
        />
        <Toolbar_Button
          icon={<ArrowDown className="w-4 h-4" />}
          onClick={handleAddRowBelow}
          title={t('editor.richTextUpdate.table.add_row_below', 'Add row below')}
          variant="ghost"
        />
        <Toolbar_Button
          icon={<Trash2 className="w-4 h-4" />}
          onClick={handleDeleteRow}
          title={t('editor.richTextUpdate.table.delete_row', 'Delete row')}
          variant="ghost"
        />
      </div>

      {/* Column operations group */}
      <div className="flex gap-0.5 border-r border-border pr-0.5 mr-0.5">
        <Toolbar_Button
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={handleAddColumnBefore}
          title={t('editor.richTextUpdate.table.add_column_before', 'Add column before')}
          variant="ghost"
        />
        <Toolbar_Button
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={handleAddColumnAfter}
          title={t('editor.richTextUpdate.table.add_column_after', 'Add column after')}
          variant="ghost"
        />
        <Toolbar_Button
          icon={<Trash2 className="w-4 h-4" />}
          onClick={handleDeleteColumn}
          title={t('editor.richTextUpdate.table.delete_column', 'Delete column')}
          variant="ghost"
        />
      </div>

      {/* Header and table operations group */}
      <div className="flex gap-0.5">
        <Toolbar_Button
          icon={<Grid className="w-4 h-4" />}
          onClick={handleToggleHeaderRow}
          title={t('editor.richTextUpdate.table.toggle_header_row', 'Toggle header row')}
          variant="ghost"
        />
        <Toolbar_Button
          icon={<Trash2 className="w-4 h-4" />}
          onClick={handleDeleteTable}
          title={t('editor.richTextUpdate.table.delete_table', 'Delete table')}
          variant="ghost"
        />
      </div>
    </div>
  );
};
