/**
 * StatusBadge Component
 * Editor status indicator with dot and label text
 * 
 * Features:
 * - 6px circular dot indicator
 * - Three status states: unsaved (amber), saving (pulsing), saved (green)
 * - Label text accompanying the status
 * - HSL token-based color mapping
 * - Smooth transitions between states
 * 
 * Validates: Requirement 2.7, 8.2
 */

import React from 'react';
import type { StatusBadgeState } from '@/components/fields/FieldRendererComponents/types/editor';

export interface StatusBadgeProps {
  /**
   * Current status state
   * - 'unsaved': amber/destructive color, indicates unsaved changes
   * - 'saving': pulsing muted-foreground, indicates save in progress
   * - 'saved': green/success color, indicates all changes saved
   */
  status: StatusBadgeState;
  
  /**
   * Optional label text to display next to the dot
   */
  label?: string;
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * StatusBadge - Renders a status indicator with dot and label
 * 
 * Usage:
 * ```tsx
 * <StatusBadge status="unsaved" label="Unsaved" />
 * <StatusBadge status="saving" label="Saving..." />
 * <StatusBadge status="saved" label="Saved" />
 * ```
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  // Determine dot color based on status
  const getDotColor = (): string => {
    switch (status) {
      case 'unsaved':
        // Amber/destructive token
        return 'bg-destructive';
      case 'saving':
        // Pulsing muted-foreground token
        return 'bg-muted-foreground animate-pulse';
      case 'saved':
        // Green/success token
        return 'bg-success';
      default:
        return 'bg-muted-foreground';
    }
  };

  const dotColor = getDotColor();

  const containerClassName = `
    inline-flex
    items-center
    gap-2
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const dotClassName = `
    w-1.5
    h-1.5
    rounded-full
    ${dotColor}
    transition-all
    duration-200
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClassName}>
      <div className={dotClassName} />
      {label && (
        <span className="text-xs font-medium text-foreground/80">
          {label}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
