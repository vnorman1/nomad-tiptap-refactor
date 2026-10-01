import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathFormulaNodeView } from './MathFormulaNodeView';

export interface MathFormulaOptions {
    HTMLAttributes: Record<string, any>;
}

export const MathFormula = Node.create<MathFormulaOptions>({
    name: 'mathFormula',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'nomad-math-formula my-4 py-2 text-center overflow-x-auto select-none',
            },
        };
    },

    addAttributes() {
        return {
            latex: {
                default: '',
            },
            display: {
                default: true,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="math-formula"]',
                getAttrs: (element) => {
                    const el = element as HTMLElement;
                    return {
                        latex: el.getAttribute('data-latex') || '',
                        display: el.getAttribute('data-display') !== 'false',
                    };
                },
            },
            {
                tag: 'span[data-type="math-formula"]',
                getAttrs: (element) => {
                    const el = element as HTMLElement;
                    return {
                        latex: el.getAttribute('data-latex') || '',
                        display: el.getAttribute('data-display') === 'true',
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        const latex = node.attrs.latex || '';
        const display = node.attrs.display ?? true;

        return [
            display ? 'div' : 'span',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'math-formula',
                'data-latex': latex,
                'data-display': display ? 'true' : 'false',
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MathFormulaNodeView);
    },

    addCommands() {
        return {
            setMathFormula: (options?: { latex?: string; display?: boolean }) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        latex: options?.latex ?? '',
                        display: options?.display ?? true,
                    },
                });
            },
        };
    },
});
