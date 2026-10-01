/**
 * FloatingPanel Component
 * Portal-rendered popover wrapper for floating UI elements
 * 
 * Features:
 * - Portal-based rendering to escape stacking contexts
 * - Fixed positioning with configurable z-index
 * - HSL token-based styling (border, shadow)
 * - Consistent padding and border-radius
 * 
 * Validates: Requirement 2.5
 */

import React from 'react';
import { createPortal } from 'react-dom';
import type { FloatingPanelProps } from '@/components/fields/FieldRendererComponents/types/editor';

/**
 * FloatingPanel - Portal-rendered popover with fixed positioning
 * 
 * @param position - Position object with top/left coordinates (required)
 * @param children - ReactNode content to render inside panel
 * @param className - Optional additional CSS classes
 * @param style - Optional inline styles (merged with calculated position)
 * @param zIndex - Optional z-index value (default: 999999)
 * 
 * Usage:
 * ```tsx
 * <FloatingPanel
 *   position={{ top: 100, left: 200 }}
 *   zIndex={999999}
 * >
 *   <div>Panel content</div>
 * </FloatingPanel>
 * ```
 */
export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  position,
  children,
  className = '',
  style = {},
  zIndex = 999999,
}) => {
  // Calculate fixed position styles
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.top}px`,
    left: position.left !== undefined ? `${position.left}px` : undefined,
    right: position.right !== undefined ? `${position.right}px` : undefined,
    bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
    zIndex,
    ...style,
  };

  // Panel container className with HSL token-based styling
  // - 8px padding
  // - 1px border using --border token
  // - box-shadow using --shadow token
  // - 6px border-radius
  const panelClassName = `
    p-2
    border
    border-border
    rounded-[6px]
    shadow-md
    bg-background
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return createPortal(
    <div className={panelClassName} style={panelStyle}>
      {children}
    </div>,
    document.body
  );
};

export default FloatingPanel;
