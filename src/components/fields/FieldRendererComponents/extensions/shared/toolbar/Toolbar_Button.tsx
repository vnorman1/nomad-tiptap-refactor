/**
 * Toolbar_Button Component
 * Reusable icon button for toolbar and menu contexts with variant styling
 * 
 * @requirements 2.1, 2.8, 14.1, 14.3
 */

import React from 'react';
import type { ToolbarButtonProps } from '@/components/fields/FieldRendererComponents/types/editor';

/**
 * Toolbar_Button - Icon button with context-aware styling variants
 * 
 * Variants:
 * - 'toolbar': Bordered background on hover
 * - 'menu': Full-width block layout
 * - 'ghost': No border or background (default)
 * 
 * When isActive=true, applies bg-foreground text-background styling
 */
export const Toolbar_Button = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(
  (
    {
      icon,
      isActive = false,
      onClick,
      title,
      variant = 'ghost',
      disabled = false,
      className = '',
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      toolbar: `px-2 py-2 rounded border border-border ${
        isActive
          ? 'bg-foreground text-background border-foreground'
          : 'hover:bg-card hover:border-foreground text-foreground'
      }`,
      menu: `w-full px-3 py-2 rounded text-foreground justify-start ${
        isActive
          ? 'bg-foreground text-background'
          : 'hover:bg-muted'
      }`,
      ghost: `px-2 py-2 rounded text-foreground ${
        isActive
          ? 'bg-foreground text-background'
          : 'hover:bg-muted'
      }`,
    };

    const finalClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

    return (
      <button
        ref={ref}
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={finalClasses}
        type="button"
      >
        {icon}
      </button>
    );
  }
);

Toolbar_Button.displayName = 'Toolbar_Button';
