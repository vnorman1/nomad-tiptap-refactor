import { TableHeader } from '@tiptap/extension-table';
import './table.css';

/**
 * CustomTableHeader Extension
 * 
 * Extends Tiptap's TableHeader extension with Nomad-specific styling and configuration.
 * 
 * **Styling:**
 * - Renders `<th>` elements with distinct background color using the secondary token
 *   at 0.3 opacity, visually separating headers from the desk/page background (Requirement 6.2)
 * - Applies padding, bold text, and left alignment
 * - Applies `.selected` class when header cell is selected for visual selection feedback
 * 
 * **Selection Styling (Requirement 6.2):**
 * When a table header cell is selected, the `.selected` class is applied to render
 * a semi-transparent primary color overlay, indicating the cell is selected.
 * 
 * **Serialization (renderHTML):**
 * Produces `<th>` HTML with class attribute values identical to current implementation.
 * 
 * **Validation: Requirement 6.1, 6.2, 6.3, 11.6**
 */

export interface CustomTableHeaderOptions {
  HTMLAttributes: Record<string, any>;
}

export const CustomTableHeader = TableHeader.extend({
  name: 'tableHeader',

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: 'border border-border bg-secondary/30 px-3 py-2 text-left font-semibold text-foreground',
      },
    };
  },
});
