/**
 * ToolbarGroup Component
 * Wraps related toolbar buttons with consistent spacing and optional label
 * 
 * @requirements 2.3, 14.1, 14.3
 */

import React from 'react';

export interface ToolbarGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

/**
 * ToolbarGroup - Container for related toolbar buttons
 * Provides consistent gap-1 spacing and optional label (max 32 chars)
 */
export const ToolbarGroup = React.forwardRef<
  HTMLDivElement,
  ToolbarGroupProps
>(({ children, label, className = '' }, ref) => {
  // Truncate label to 32 characters
  const displayLabel = label ? label.slice(0, 32) : undefined;

  return (
    <div ref={ref} className={`flex flex-col gap-1 ${className}`}>
      {displayLabel && (
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-widest px-2">
          {displayLabel}
        </label>
      )}
      <div className="flex gap-1 items-center">{children}</div>
    </div>
  );
});

ToolbarGroup.displayName = 'ToolbarGroup';
