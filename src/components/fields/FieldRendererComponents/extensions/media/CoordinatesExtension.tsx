import { Node, mergeAttributes } from '@tiptap/core';

export interface CoordinatesOptions {
    HTMLAttributes: Record<string, any>;
}

/**
 * Coordinates Extension
 *
 * A custom Tiptap node for embedding Google Maps embeds via coordinates (latitude/longitude).
 * Features:
 * - lat and lng attributes (strings)
 * - parseHTML to extract data-lat and data-lng from iframe[data-type="coordinates"]
 * - renderHTML to generate iframe with Google Maps embed URL and data attributes
 * - setCoordinates command to insert coordinate nodes
 */
export const Coordinates = Node.create<CoordinatesOptions>({
    name: 'coordinates',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'w-full aspect-video rounded-lg shadow-sm border border-border/50 my-4',
                frameborder: '0',
                scrolling: 'no',
                marginheight: '0',
                marginwidth: '0',
            },
        };
    },

    addAttributes() {
        return {
            lat: {
                default: null,
            },
            lng: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'iframe[data-type="coordinates"]',
                getAttrs: (element) => {
                    const el = element as HTMLElement;
                    return {
                        lat: el.getAttribute('data-lat'),
                        lng: el.getAttribute('data-lng'),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const lat = HTMLAttributes.lat;
        const lng = HTMLAttributes.lng;
        const src = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

        return [
            'iframe',
            mergeAttributes(this.options.HTMLAttributes, {
                src,
                'data-type': 'coordinates',
                'data-lat': lat,
                'data-lng': lng,
            }),
        ];
    },

    addCommands() {
        return {
            setCoordinates:
                (options: { lat: string; lng: string }) =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: options,
                    });
                },
        };
    },
});
