/**
 * PreviewBox Component
 * Preview region for math/content display with centered alignment
 * 
 * Features:
 * - Minimum height of 48px
 * - Centered content via text-align center
 * - Horizontal scroll fallback for overflow content
 * - HSL token-based theming (background, foreground)
 * 
 * Validates: Requirement 2.6
 */

import React from 'react';

export interface PreviewBoxProps {
  /**
   * Content to render inside the preview box
   */
  children: React.ReactNode;
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
  
  /**
   * Optional inline styles
   */
  style?: React.CSSProperties;
  
  /**
   * Optional HTML content to render (for KaTeX preview HTML)
   */
  dangerouslySetInnerHTML?: { __html: string };
}

/**
 * PreviewBox - Renders a KaTeX or content preview area
 * 
 * Usage:
 * ```tsx
 * // Text content
 * <PreviewBox>
 *   Preview content here
 * </PreviewBox>
 * 
 * // HTML content (e.g., KaTeX output)
 * <PreviewBox dangerouslySetInnerHTML={{ __html: katexHtml }} />
 * ```
 */
export const PreviewBox: React.FC<PreviewBoxProps> = ({
  children,
  className = '',
  style = {},
  dangerouslySetInnerHTML,
}) => {
  const previewClassName = `
    min-h-[48px]
    text-center
    overflow-x-auto
    bg-background
    text-foreground
    flex
    items-center
    justify-center
    p-2
    rounded-[4px]
    border
    border-border
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div
      className={previewClassName}
      style={style}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    >
      {!dangerouslySetInnerHTML && children}
    </div>
  );
};

export default PreviewBox;
