/**
 * ToolbarSeparator Component
 * Vertical divider for toolbar grouping
 * 
 * @requirements 2.2, 14.1, 14.3
 */

import React from 'react';

export interface ToolbarSeparatorProps {
  className?: string;
}

/**
 * ToolbarSeparator - Vertical divider using --border HSL token
 * Separates groups of toolbar buttons
 */
export const ToolbarSeparator = React.forwardRef<
  HTMLDivElement,
  ToolbarSeparatorProps
>(({ className = '' }, ref) => {
  return (
    <div
      ref={ref}
      className={`h-6 w-px bg-border ${className}`}
      role="separator"
      aria-orientation="vertical"
    />
  );
});

ToolbarSeparator.displayName = 'ToolbarSeparator';
