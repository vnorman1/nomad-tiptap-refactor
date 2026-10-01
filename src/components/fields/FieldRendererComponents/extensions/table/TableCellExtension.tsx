import { TableCell } from '@tiptap/extension-table';
import './table.css';

/**
 * CustomTableCell Extension
 * 
 * Extends Tiptap's TableCell extension with Nomad-specific styling and configuration.
 * 
 * **Styling:**
 * - Renders `<td>` elements with vertically top-aligned content (Requirement 6.2)
 * - Applies padding, borders, and foreground text color
 * - Applies `.selected` class when cell is selected for visual selection feedback
 * - Ensures visual consistency across all table cells
 * 
 * **Selection Styling (Requirement 6.2):**
 * When a table cell is selected in the editor, the `.selected` class is applied
 * to render a visible background tint using the primary token at 0.1 opacity,
 * providing clear visual feedback during table editing.
 * 
 * **Serialization (renderHTML):**
 * Produces `<td>` HTML with class attribute values identical to current implementation.
 * 
 * **Validation: Requirement 6.1, 6.2, 6.3, 11.6**
 */

export interface CustomTableCellOptions {
  HTMLAttributes: Record<string, any>;
}

export const CustomTableCell = TableCell.extend({
  name: 'tableCell',

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: 'border border-border px-3 py-2 text-foreground align-top',
      },
    };
  },
});
