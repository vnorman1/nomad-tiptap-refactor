import { Node, mergeAttributes } from '@tiptap/core';
import { getCentralAlt } from '../../types';
import { I18N_CONFIG } from '@/config/admin.config';

/**
 * Resolves the central alt text for a given source.
 * @param src - The video source URL or identifier
 * @returns The resolved alt text string
 */
function getResolvedCentralAlt(src: unknown): string {
    const central = getCentralAlt(src);
    const defLang = I18N_CONFIG.defaultLanguage || 'hu';
    return central[defLang] || Object.values(central)[0] || '';
}

export interface VideoOptions {
    HTMLAttributes: Record<string, any>;
}

/**
 * Video Extension
 *
 * A custom Tiptap node for embedding video elements.
 * Features:
 * - src and alt attributes
 * - parseHTML to extract attributes from <video> tags
 * - renderHTML to serialize to <video> elements with proper attributes
 * - Alt text resolution using central alt dictionaries
 * - setVideo command to insert video nodes
 */
export const Video = Node.create<VideoOptions>({
    name: 'video',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'w-full rounded-lg shadow-sm border border-border/50 my-4',
                controls: true,
            },
        };
    },

    addAttributes() {
        return {
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
        };
    },

    parseHTML() {
        return [
            {
                tag: 'video[src]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'video',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },

    addCommands() {
        return {
            setVideo:
                (options: { src: string; alt?: string }) =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: options,
                    });
                },
        };
    },
});
