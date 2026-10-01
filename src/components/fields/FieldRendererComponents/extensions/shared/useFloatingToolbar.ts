/**
 * useFloatingToolbar Hook
 *
 * Manages floating toolbar visibility and positioning based on text selection
 *
 * This hook tracks the current text selection in the editor and calculates the optimal
 * position for a floating toolbar that appears above the selection. It handles viewport
 * bounds checking and falls back to below-selection positioning when necessary.
 *
 * Features:
 * - Tracks non-empty text selections
 * - Calculates bounding rect for the selection
 * - Positions toolbar 8px above selection, horizontally centered
 * - Falls back to below-selection if top is within 60px of viewport top
 * - Keeps toolbar within viewport bounds
 * - Updates position on selectionchange events
 *
 * Validates: Requirement 7.1, 7.5
 * Property 9: Muted Mode Prevents UI Rendering Based on Editor State
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { FloatingPosition } from '../../types/editor';

/**
 * Options for toolbar positioning
 */
export interface UseFloatingToolbarOptions {
  /** Whether the toolbar should be enabled (respects editor disabled/readOnly state) */
  enabled?: boolean;
  /** Offset in pixels above the selection (default: 8px) */
  offsetAbove?: number;
  /** Offset in pixels below the selection (default: 8px) */
  offsetBelow?: number;
  /** Minimum distance from viewport top to position above (in pixels, default: 60px) */
  viewportTopThreshold?: number;
  /** Padding from viewport edges (default: 8px) */
  viewportPadding?: number;
}

/**
 * Result of toolbar positioning calculation
 */
export interface FloatingToolbarResult {
  /** Whether the toolbar should be visible */
  isVisible: boolean;
  /** Calculated position for the toolbar (fixed positioning) */
  position: FloatingPosition;
  /** Currently active text selection (for client-side ref tracking) */
  selection: Selection | null;
}

/**
 * Core logic for calculating toolbar position from selection bounds
 * Exported separately to enable testing without React
 *
 * @param options - Configuration object
 * @returns Object containing visibility, position, and selection
 *
 * @internal Used by useFloatingToolbar and for testing
 */
export function calculateToolbarPosition(
  options: UseFloatingToolbarOptions = {}
): FloatingToolbarResult {
  const {
    enabled = true,
    offsetAbove = 8,
    offsetBelow = 8,
    viewportTopThreshold = 60,
    viewportPadding = 8,
  } = options;

  // If toolbar is disabled, never show it
  if (!enabled) {
    return {
      isVisible: false,
      position: { top: 0, left: 0 },
      selection: null,
    };
  }

  // Get the current selection
  const selection = typeof window !== 'undefined' ? window.getSelection() : null;

  // Check if selection is valid and non-empty
  if (!selection || selection.toString().trim() === '') {
    return {
      isVisible: false,
      position: { top: 0, left: 0 },
      selection,
    };
  }

  try {
    // Get the bounding rect of the selection
    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;

    // Calculate horizontal center of selection
    const selectionCenterX = selectionRect.left + selectionRect.width / 2;

    // Determine if we should position above or below the selection
    const shouldPositionBelow = selectionRect.top < viewportTopThreshold;

    let top: number;
    let left: number;

    if (shouldPositionBelow) {
      // Position below the selection
      top = Math.round(selectionRect.bottom + offsetBelow);
    } else {
      // Position above the selection
      top = Math.round(selectionRect.top - offsetAbove);
    }

    // Horizontally center the toolbar (assuming toolbar width will be controlled by CSS)
    left = Math.round(selectionCenterX);

    // Ensure position is within viewport bounds
    // Left edge: at least viewportPadding from left
    // Right edge: at most (viewportWidth - viewportPadding) from left
    // Top edge: at least viewportPadding from top
    // Bottom edge: handled by CSS (fixed positioning)

    left = Math.max(viewportPadding, Math.min(left, viewportWidth - viewportPadding));
    top = Math.max(viewportPadding, top);

    return {
      isVisible: true,
      position: {
        top,
        left,
      },
      selection,
    };
  } catch {
    // If we can't get the selection rect, don't show the toolbar
    return {
      isVisible: false,
      position: { top: 0, left: 0 },
      selection,
    };
  }
}

/**
 * Manages floating toolbar visibility and positioning based on text selection
 *
 * @param options - Configuration for toolbar behavior
 * @returns Object containing toolbar visibility, position, and selection reference
 *
 * @example
 * const { isVisible, position } = useFloatingToolbar({
 *   enabled: !editor.isEditable,
 *   offsetAbove: 12,
 * });
 *
 * if (isVisible) {
 *   return (
 *     <div style={{ top: position.top, left: position.left }}>
 *       // toolbar buttons here
 *     </div>
 *   );
 * }
 */
export function useFloatingToolbar(
  options: UseFloatingToolbarOptions = {}
): FloatingToolbarResult {
  const [result, setResult] = useState<FloatingToolbarResult>({
    isVisible: false,
    position: { top: 0, left: 0 },
    selection: null,
  });

  // Track if component is mounted to avoid state updates on unmounted components
  const isMountedRef = useRef(true);

  // Callback to recalculate position
  const updatePosition = useCallback(() => {
    if (!isMountedRef.current) return;

    const newResult = calculateToolbarPosition(options);
    setResult(newResult);
  }, [options]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initial calculation
  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  // Listen for selection changes
  useEffect(() => {
    // Use selectionchange event which fires on any selection change
    const handleSelectionChange = () => {
      updatePosition();
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updatePosition]);

  // Listen for scroll and resize to update position
  useEffect(() => {
    const handleScrollOrResize = () => {
      updatePosition();
    };

    // Use capture: true for scroll to catch early
    window.addEventListener('scroll', handleScrollOrResize, { capture: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [updatePosition]);

  return result;
}

export default useFloatingToolbar;
