/**
 * ToolbarSelect Component
 * Dropdown selection component for toolbar contexts
 * 
 * @requirements 2.4, 14.1, 14.3
 */

import React from 'react';

export interface ToolbarSelectOption {
  value: string;
  label: string;
}

export interface ToolbarSelectProps {
  options: ToolbarSelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * ToolbarSelect - Dropdown selection using HSL tokens
 * Emits onChange callback with string value from selected option
 */
export const ToolbarSelect = React.forwardRef<
  HTMLSelectElement,
  ToolbarSelectProps
>(
  (
    {
      options,
      value,
      onChange,
      label,
      disabled = false,
      className = '',
      ariaLabel,
    },
    ref
  ) => {
    const selectClasses = `
      px-3 py-2 rounded
      bg-background border border-border
      text-foreground
      hover:border-foreground
      focus:outline-none focus:ring-1 focus:ring-foreground
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200
      cursor-pointer
      ${className}
    `.trim();

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            {label}
          </label>
        )}
        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={selectClasses}
          aria-label={ariaLabel || label}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

ToolbarSelect.displayName = 'ToolbarSelect';
