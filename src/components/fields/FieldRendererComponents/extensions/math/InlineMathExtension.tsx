import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { InlineMathNodeView } from './InlineMathNodeView';

export interface InlineMathOptions {
    HTMLAttributes?: Record<string, any>;
}

export const InlineMath = Node.create<InlineMathOptions>({
    name: 'inlineMath',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'inline-math-node align-baseline select-none cursor-pointer',
            },
        };
    },

    addAttributes() {
        return {
            latex: {
                default: '',
                parseHTML: element => element.getAttribute('data-latex') || element.textContent || '',
                renderHTML: attributes => ({
                    'data-type': 'inline-math',
                    'data-latex': attributes.latex || '',
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="inline-math"]',
                getAttrs: element => {
                    const el = element as HTMLElement;
                    return {
                        latex: el.getAttribute('data-latex') || el.textContent || '',
                    };
                },
            },
            {
                tag: 'span.inline-math-node',
                getAttrs: element => {
                    const el = element as HTMLElement;
                    return {
                        latex: el.getAttribute('data-latex') || el.textContent || '',
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        const latex = node.attrs.latex || '';

        return [
            'span',
            mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes, {
                'data-type': 'inline-math',
                'data-latex': latex,
                class: 'inline-math-node select-none cursor-pointer',
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(InlineMathNodeView);
    },

    addCommands() {
        return {
            insertInlineMath: (options?: { latex?: string }) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        latex: options?.latex ?? '',
                    },
                });
            },
        };
    },
});
