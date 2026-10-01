import Image from '@tiptap/extension-image';
import { getCentralAlt } from '../../types';
import { I18N_CONFIG } from '@/config/admin.config';

/**
 * Resolves the central alt text for a given source.
 * @param src - The image source URL or identifier
 * @returns The resolved alt text string
 */
function getResolvedCentralAlt(src: unknown): string {
    const central = getCentralAlt(src);
    const defLang = I18N_CONFIG.defaultLanguage || 'hu';
    return central[defLang] || Object.values(central)[0] || '';
}

/**
 * CustomImage Extension
 *
 * Extends the default Tiptap Image extension with:
 * - Enhanced alt text resolution using central alt dictionaries
 * - Custom parseHTML to extract alt from attributes or central sources
 * - Custom renderHTML to serialize alt text correctly
 * - Support for title attribute
 *
 * Validates: Requirements 3.1, 11.1 (serialization round-trip)
 */
export const CustomImage = Image.extend({
    name: 'image',

    addAttributes() {
        return {
            ...this.parent?.(),
            src: {
                default: null,
            },
            alt: {
                default: null,
                parseHTML: (element: HTMLElement) => {
                    const explicitAlt = element.getAttribute('alt');
                    if (
                        explicitAlt !== null &&
                        explicitAlt !== undefined &&
                        explicitAlt.trim() !== ''
                    ) {
                        return explicitAlt;
                    }
                    const src = element.getAttribute('src');
                    return getResolvedCentralAlt(src) || null;
                },
                renderHTML: (attributes: Record<string, any>) => {
                    const explicitAlt = attributes.alt;
                    if (explicitAlt && String(explicitAlt).trim()) {
                        return { alt: explicitAlt };
                    }
                    const centralAlt = getResolvedCentralAlt(attributes.src);
                    if (centralAlt) {
                        return { alt: centralAlt };
                    }
                    return {};
                },
            },
            title: {
                default: null,
            },
        };
    },
});
