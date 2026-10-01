/**
 * Unit Tests for useMediaAttributes Hook
 * 
 * Tests the alt text resolution logic with language priority fallback
 * covering all priority tiers and edge cases
 */

import { describe, it, expect } from 'vitest';
import { resolveMediaAttributes } from './useMediaAttributes';

/**
 * Test helper using the core resolveMediaAttributes function
 * This allows testing without React components
 */
function testResolveMediaAttributes(options: Parameters<typeof resolveMediaAttributes>[0]) {
  return resolveMediaAttributes(options);
}

describe('useMediaAttributes Hook', () => {
  describe('Priority 1: Active Language', () => {
    it('should return active language alt text when present and non-empty', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: 'Dog running', hu: 'Kutya fut' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('Dog running');
      expect(result.isEmpty).toBe(false);
      expect(result.isWhitespaceOnly).toBe(false);
    });

    it('should trim whitespace from active language value', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '  Dog running  ', hu: 'Kutya fut' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('Dog running');
    });
  });

  describe('Priority 2: Default Language Fallback', () => {
    it('should fall back to default language when active language is empty', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '', hu: 'Kutya fut' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('Kutya fut');
      expect(result.isEmpty).toBe(false);
    });

    it('should fall back to default language when active language is whitespace-only', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '   ', hu: 'Kutya fut' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('Kutya fut');
    });

    it('should fall back to default language when active language is missing', () => {
      const result = testResolveMediaAttributes({
        altDict: { hu: 'Kutya fut' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('Kutya fut');
    });

    it('should not use default language if active and default are the same and is empty', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '', hu: 'Kutya fut' },
        activeLanguage: 'en',
        defaultLanguage: 'en', // same as active
      });

      expect(result.altText).toBe('Kutya fut');
    });
  });

  describe('Priority 3: First Available Non-Empty Value', () => {
    it('should use first non-empty value when active and default are empty', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '', hu: '', fr: 'Chien qui court' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      // Note: order depends on Object.values() which may vary, but should find 'fr'
      expect(result.altText).toBe('Chien qui court');
    });

    it('should find first non-empty value across multiple languages', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '', hu: '', de: 'Laufender Hund', es: 'Perro corriendo' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBeTruthy();
      expect(['Laufender Hund', 'Perro corriendo']).toContain(result.altText);
    });
  });

  describe('Priority 4: Empty String Fallback', () => {
    it('should return empty string when all values are empty', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '', hu: '', fr: '' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('');
      expect(result.isEmpty).toBe(true);
    });

    it('should return empty string when all values are whitespace-only', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: '   ', hu: '\t', fr: '\n' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('');
      expect(result.isEmpty).toBe(true);
      expect(result.isWhitespaceOnly).toBe(true);
    });

    it('should return empty string when altDict is empty object', () => {
      const result = testResolveMediaAttributes({
        altDict: {},
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('');
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('Edge Cases: Invalid Input', () => {
    it('should handle null altDict gracefully', () => {
      const result = testResolveMediaAttributes({
        altDict: null,
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('');
      expect(result.isEmpty).toBe(true);
    });

    it('should handle undefined altDict gracefully', () => {
      const result = testResolveMediaAttributes({
        altDict: undefined,
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('');
      expect(result.isEmpty).toBe(true);
    });

    it('should handle missing options gracefully', () => {
      const result = testResolveMediaAttributes({});

      expect(result.altText).toBe('');
      expect(result.isEmpty).toBe(true);
    });

    it('should handle undefined activeLanguage and defaultLanguage', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: 'Dog running', hu: 'Kutya fut' },
        activeLanguage: undefined,
        defaultLanguage: undefined,
      });

      // Should find first non-empty value
      expect(result.altText).toBeTruthy();
    });

    it('should handle non-string altDict values', () => {
      const result = testResolveMediaAttributes({
        altDict: { en: 123 as any, hu: { text: 'test' } as any },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('');
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('Complex Language Scenarios', () => {
    it('should handle three-language dictionary with priority fallback', () => {
      const result = testResolveMediaAttributes({
        altDict: {
          en: 'Dog running',
          hu: 'Kutya fut',
          de: 'Laufender Hund',
        },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('Dog running');
    });

    it('should prioritize active over default when both are present', () => {
      const result = testResolveMediaAttributes({
        altDict: {
          en: 'English text',
          hu: 'Hungarian text',
          de: 'German text',
        },
        activeLanguage: 'de',
        defaultLanguage: 'hu',
      });

      expect(result.altText).toBe('German text');
    });

    it('should handle language code case sensitivity', () => {
      const result = testResolveMediaAttributes({
        altDict: {
          en: 'English',
          EN: 'ENGLISH',
        },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      // Should match exact case
      expect(result.altText).toBe('English');
    });
  });

  describe('Empty Flag Accuracy', () => {
    it('should set isEmpty to true only when altText is empty string', () => {
      const result1 = testResolveMediaAttributes({
        altDict: {},
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result1.isEmpty).toBe(true);

      const result2 = testResolveMediaAttributes({
        altDict: { en: 'Text' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(result2.isEmpty).toBe(false);
    });

    it('should distinguish between empty and whitespace-only', () => {
      const emptyResult = testResolveMediaAttributes({
        altDict: { en: '' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(emptyResult.isEmpty).toBe(true);
      expect(emptyResult.isWhitespaceOnly).toBe(false);

      const whitespaceResult = testResolveMediaAttributes({
        altDict: { en: '   ' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });

      expect(whitespaceResult.isEmpty).toBe(true);
      expect(whitespaceResult.isWhitespaceOnly).toBe(true);
    });
  });

  describe('Requirement 3.7 - Alt Text Priority Resolution', () => {
    it('validates requirement 3.7: activeLanguage → defaultLanguage → first non-empty → empty string', () => {
      // Test case 1: Active language takes precedence
      const test1 = testResolveMediaAttributes({
        altDict: { en: 'English', hu: 'Hungarian', de: 'German' },
        activeLanguage: 'de',
        defaultLanguage: 'hu',
      });
      expect(test1.altText).toBe('German');

      // Test case 2: Falls back to default when active is empty
      const test2 = testResolveMediaAttributes({
        altDict: { en: '', hu: 'Hungarian', de: 'German' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });
      expect(test2.altText).toBe('Hungarian');

      // Test case 3: Falls back to first non-empty when active and default are empty
      const test3 = testResolveMediaAttributes({
        altDict: { en: '', hu: '', de: 'German' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });
      expect(test3.altText).toBe('German');

      // Test case 4: Falls back to empty string when all are empty
      const test4 = testResolveMediaAttributes({
        altDict: { en: '', hu: '', de: '' },
        activeLanguage: 'en',
        defaultLanguage: 'hu',
      });
      expect(test4.altText).toBe('');
    });
  });
});
