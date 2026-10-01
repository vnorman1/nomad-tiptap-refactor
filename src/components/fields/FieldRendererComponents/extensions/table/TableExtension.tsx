import { Table } from '@tiptap/extension-table';
import './table.css';

/**
 * CustomTable Extension
 * 
 * Extends Tiptap's Table extension with Nomad-specific configuration for table rendering and commands.
 * 
 * **Styling:**
 * - Applies `.nomad-table` class for consistent table styling
 * - Enables column resizing with visual feedback via the resize handle accent
 * - Supports table cell selection styling (Requirement 6.2, 6.3)
 * 
 * **Column Resize Handles:**
 * When a user interacts with a column resize handle, the handle renders with an
 * accent color to distinguish it from inactive handles (Requirement 6.2).
 * 
 * **Serialization (renderHTML):**
 * Produces `<table>` HTML with class, border, and cellpadding attributes matching the current implementation.
 * 
 * **Validation: Requirement 6.1, 6.2, 6.3, 11.6**
 */

export interface CustomTableOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customTable: {
      insertNomadTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType;
    };
  }
}

export const CustomTable = Table.extend({
  name: 'table',

  addOptions() {
    return {
      ...(this.parent?.() || {}),
      resizable: true,
      lastColumnResizable: true,
      renderWrapper: false,
      HTMLAttributes: {
        class: 'nomad-table w-full my-4 border-collapse text-xs border border-border',
      },
    } as any;
  },

  addCommands() {
    return {
      ...this.parent?.(),
      insertNomadTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ({ commands }) => {
        return commands.insertTable({
          rows: options?.rows ?? 3,
          cols: options?.cols ?? 3,
          withHeaderRow: options?.withHeaderRow ?? true,
        });
      },
    };
  },
});
