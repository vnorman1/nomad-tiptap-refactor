import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEditor } from '@tiptap/react';
import { TableActionBar } from './TableActionBar';
import { CustomTable, CustomTableRow, CustomTableHeader, CustomTableCell } from './index';

/**
 * TableActionBar Test Suite
 * 
 * Tests table action bar rendering and button interactions
 * **Validates: Requirement 6.4, 6.5**
 */

describe('TableActionBar', () => {
  let mockEditor: any;

  beforeEach(() => {
    // Mock editor with table commands
    mockEditor = {
      chain: vi.fn(() => ({
        focus: vi.fn(() => ({
          addRowBefore: vi.fn(() => ({ run: vi.fn() })),
          addRowAfter: vi.fn(() => ({ run: vi.fn() })),
          deleteRow: vi.fn(() => ({ run: vi.fn() })),
          addColumnBefore: vi.fn(() => ({ run: vi.fn() })),
          addColumnAfter: vi.fn(() => ({ run: vi.fn() })),
          deleteColumn: vi.fn(() => ({ run: vi.fn() })),
          toggleHeaderRow: vi.fn(() => ({ run: vi.fn() })),
          deleteTable: vi.fn(() => ({ run: vi.fn() })),
        })),
      })),
    };
  });

  it('should render all table action buttons', () => {
    render(
      <TableActionBar 
        editor={mockEditor} 
        position={{ top: 10, left: 10 }} 
      />
    );

    // Check for all buttons by their titles
    expect(screen.getByTitle(/add row above/i)).toBeInTheDocument();
    expect(screen.getByTitle(/add row below/i)).toBeInTheDocument();
    expect(screen.getByTitle(/delete row/i)).toBeInTheDocument();
    expect(screen.getByTitle(/add column before/i)).toBeInTheDocument();
    expect(screen.getByTitle(/add column after/i)).toBeInTheDocument();
    expect(screen.getByTitle(/delete column/i)).toBeInTheDocument();
    expect(screen.getByTitle(/toggle header row/i)).toBeInTheDocument();
    expect(screen.getByTitle(/delete table/i)).toBeInTheDocument();
  });

  it('should position the action bar with provided coordinates', () => {
    const { container } = render(
      <TableActionBar 
        editor={mockEditor} 
        position={{ top: 100, left: 200 }} 
      />
    );

    const bar = container.querySelector('[style*="top"]') as HTMLElement;
    expect(bar).toHaveStyle('top: 100px');
    expect(bar).toHaveStyle('left: 200px');
  });

  it('should call addRowBefore when add row above button is clicked', () => {
    const mockRun = vi.fn();
    const mockAddRowBefore = vi.fn(() => ({ run: mockRun }));
    
    mockEditor.chain.mockReturnValue({
      focus: vi.fn(() => ({
        addRowBefore: mockAddRowBefore,
      })),
    });

    render(
      <TableActionBar 
        editor={mockEditor} 
        position={{ top: 10, left: 10 }} 
      />
    );

    const addRowAboveBtn = screen.getByTitle(/add row above/i);
    fireEvent.click(addRowAboveBtn);

    expect(mockAddRowBefore).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
  });

  it('should call deleteColumn when delete column button is clicked', () => {
    const mockRun = vi.fn();
    const mockDeleteColumn = vi.fn(() => ({ run: mockRun }));
    
    mockEditor.chain.mockReturnValue({
      focus: vi.fn(() => ({
        deleteColumn: mockDeleteColumn,
      })),
    });

    render(
      <TableActionBar 
        editor={mockEditor} 
        position={{ top: 10, left: 10 }} 
      />
    );

    const deleteColumnBtn = screen.getByTitle(/delete column/i);
    fireEvent.click(deleteColumnBtn);

    expect(mockDeleteColumn).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
  });

  it('should prompt before deleting the table', () => {
    const mockRun = vi.fn();
    const mockDeleteTable = vi.fn(() => ({ run: mockRun }));
    
    mockEditor.chain.mockReturnValue({
      focus: vi.fn(() => ({
        deleteTable: mockDeleteTable,
      })),
    });

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    render(
      <TableActionBar 
        editor={mockEditor} 
        position={{ top: 10, left: 10 }} 
      />
    );

    const deleteTableBtn = screen.getByTitle(/delete table/i);
    fireEvent.click(deleteTableBtn);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockDeleteTable).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
  });
});
