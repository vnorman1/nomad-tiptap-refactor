/**
 * useMediaAttributes Hook
 * 
 * Resolves media alt text with language fallback priority
 * 
 * Priority: activeLanguage → defaultLanguage → first non-empty → empty string
 * 
 * This hook is used by media NodeViews (ImageNodeView, VideoNodeView, AudioNodeView)
 * to display the correct language version of alt text based on the editor's active language.
 * 
 * Validates: Requirement 3.7 - Alt text display resolution follows priority order
 * Property 2: Alt Text Display Resolution Follows Priority Order
 */

import { useMemo } from 'react';

/**
 * Result of media attribute resolution
 */
export interface MediaAttributesResult {
  /** Resolved alt text for the active language or fallback */
  altText: string;
  /** Whether the alt text is empty */
  isEmpty: boolean;
  /** Whether alt text contains only whitespace */
  isWhitespaceOnly: boolean;
}

/**
 * Options for alt text resolution
 */
export interface UseMediaAttributesOptions {
  /** Dictionary mapping language codes to alt text strings */
  altDict?: Record<string, string> | null;
  /** Currently active language code (e.g., 'en', 'hu') */
  activeLanguage?: string;
  /** Default fallback language code (e.g., 'hu') */
  defaultLanguage?: string;
}

/**
 * Core logic for resolving media alt text with language priority fallback
 * Exported separately to enable testing without React
 * 
 * @param options - Configuration object with altDict, activeLanguage, defaultLanguage
 * @returns Object containing resolved altText and metadata flags
 * 
 * @internal Used by useMediaAttributes and for testing
 */
export function resolveMediaAttributes(
  options: UseMediaAttributesOptions = {}
): MediaAttributesResult {
  const { altDict, activeLanguage, defaultLanguage } = options;

  /**
   * Helper to check if a string is non-empty after trimming
   */
  const isNonEmpty = (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  };

  /**
   * Helper to check if a string is whitespace-only
   */
  const isWhitespaceOnly = (value: any): boolean => {
    return typeof value === 'string' && value.length > 0 && value.trim().length === 0;
  };

  // If altDict is not provided or not a valid object, return empty result
  if (!altDict || typeof altDict !== 'object') {
    return {
      altText: '',
      isEmpty: true,
      isWhitespaceOnly: false,
    };
  }

  let resolvedText = '';

  // Priority 1: Try active language
  if (activeLanguage && isNonEmpty(altDict[activeLanguage])) {
    resolvedText = altDict[activeLanguage].trim();
  }
  // Priority 2: Try default language (if different from active)
  else if (
    defaultLanguage &&
    activeLanguage !== defaultLanguage &&
    isNonEmpty(altDict[defaultLanguage])
  ) {
    resolvedText = altDict[defaultLanguage].trim();
  }
  // Priority 3: Try first available non-empty value
  else {
    for (const value of Object.values(altDict)) {
      if (isNonEmpty(value)) {
        resolvedText = value.trim();
        break;
      }
    }
  }

  // Determine if original was whitespace-only (before trimming for priority 3)
  let wasWhitespaceOnly = false;
  if (!resolvedText) {
    // Check if any value in the dict is whitespace-only
    for (const value of Object.values(altDict)) {
      if (isWhitespaceOnly(value)) {
        wasWhitespaceOnly = true;
        break;
      }
    }
  }

  return {
    altText: resolvedText,
    isEmpty: resolvedText === '',
    isWhitespaceOnly: wasWhitespaceOnly,
  };
}

/**
 * Resolves media alt text with language priority fallback
 * 
 * @param options - Configuration object with altDict, activeLanguage, defaultLanguage
 * @returns Object containing resolved altText and metadata flags
 * 
 * @example
 * const { altText } = useMediaAttributes({
 *   altDict: { en: 'Dog running', hu: 'Kutya fut' },
 *   activeLanguage: 'en',
 *   defaultLanguage: 'hu'
 * });
 * // altText = 'Dog running'
 * 
 * @example
 * const { altText } = useMediaAttributes({
 *   altDict: { en: '', hu: 'Kutya fut' },
 *   activeLanguage: 'en',
 *   defaultLanguage: 'hu'
 * });
 * // altText = 'Kutya fut' (falls back to default language)
 */
export function useMediaAttributes(
  options: UseMediaAttributesOptions = {}
): MediaAttributesResult {
  return useMemo(() => resolveMediaAttributes(options), [
    options.altDict,
    options.activeLanguage,
    options.defaultLanguage,
  ]);
}

export default useMediaAttributes;
