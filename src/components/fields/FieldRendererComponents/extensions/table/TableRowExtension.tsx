import { TableRow } from '@tiptap/extension-table';
import './table.css';

/**
 * CustomTableRow Extension
 * 
 * Extends Tiptap's TableRow extension with Nomad-specific configuration.
 * 
 * **Styling:**
 * - Renders `<tr>` elements as rows within the table with proper cell selection styling
 * - Works in conjunction with CustomTableCell and CustomTableHeader for consistent styling
 * 
 * **Serialization (renderHTML):**
 * Produces `<tr>` HTML elements as rows within the table.
 * 
 * **Validation: Requirement 6.1, 6.2, 6.3, 11.6**
 */

export interface CustomTableRowOptions {
  HTMLAttributes: Record<string, any>;
}

export const CustomTableRow = TableRow.extend({
  name: 'tableRow',
});
