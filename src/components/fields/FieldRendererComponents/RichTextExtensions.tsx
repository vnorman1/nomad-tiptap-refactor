import { useTranslation } from "react-i18next";
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps, type ReactNodeViewProps } from '@tiptap/react';
import CodeBlock from '@tiptap/extension-code-block';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { getCentralAlt } from './types';
import { I18N_CONFIG } from '@/config/admin.config';
import { X, Sigma, Pi, Code2, WrapText, Edit3, Trash2, Check, Copy, CheckCheck, Eye, AlignJustify, Columns, RotateCcw, ChevronDown } from 'lucide-react';
import katex from 'katex';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        video: {
            setVideo: (options: { src: string; alt?: string }) => ReturnType;
        };
        audio: {
            setAudio: (options: { src: string; alt?: string }) => ReturnType;
        };
        coordinates: {
            setCoordinates: (options: { lat: string; lng: string }) => ReturnType;
        };
        customTable: {
            insertNomadTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType;
        };
        mathFormula: {
            setMathFormula: (options?: { latex?: string; display?: boolean }) => ReturnType;
        };
        inlineMath: {
            insertInlineMath: (options?: { latex?: string }) => ReturnType;
        };
        pageBreak: {
            setPageBreak: () => ReturnType;
        };
    }
}

function getResolvedCentralAlt(src: unknown): string {
    const central = getCentralAlt(src);
    const defLang = I18N_CONFIG.defaultLanguage || 'hu';
    return central[defLang] || Object.values(central)[0] || '';
}

export function RichTextImageNode({ node, updateAttributes, selected }: ReactNodeViewProps | NodeViewProps) {
    const {
        t
    } = useTranslation(["editor", "common"]);

    const { src, alt, title } = node.attrs;
    const [isEditing, setIsEditing] = useState(false);
    const [tempAlt, setTempAlt] = useState('');

    const centralAltText = getResolvedCentralAlt(src);

    const effectiveAlt = (alt && String(alt).trim()) ? alt : centralAltText;
    const isCentral = (!alt || !String(alt).trim()) && Boolean(centralAltText);
    const hasAlt = Boolean(effectiveAlt && String(effectiveAlt).trim());

    const handleStartEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTempAlt(effectiveAlt || '');
        setIsEditing(true);
    };

    const handleSaveAlt = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        updateAttributes({ alt: tempAlt.trim() });
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveAlt();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    return (
        <NodeViewWrapper className="relative my-4 inline-block group/rich-image max-w-full leading-none">
            <div className={`relative inline-block rounded overflow-hidden border transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg' : 'border-border/60 hover:border-foreground/40'
                }`}>
                <img
                    src={src}
                    alt={effectiveAlt}
                    title={title || effectiveAlt}
                    className="max-w-full h-auto block select-none"
                    draggable="false"
                />

                {/* ALT indicator: a small "ALT" mark in the corner, not the full text.
                    The image can be any colour, so it needs to work on both a
                    light and dark photo — a translucent backdrop plus mix-blend
                    keeps it legible either way without becoming its own visual
                    block sitting on top of the image. */}
                {!isEditing && (
                    <button
                        type="button"
                        onClick={handleStartEdit}
                        title={hasAlt ? t("richTextExtensions.alt-kattints-a-szerkeszteshez", {
                            effectiveAlt,
                            var2: isCentral ? t('editor:moreEdits.kozponti-mediatar', '(központi médiatár)') : ''
                        }) : t('editor:moreEdits.nincs-alt-szoveg-kattints-a-me', 'Nincs ALT szöveg — kattints a megadáshoz')}
                        className={`absolute top-1.5 right-1.5 flex items-center justify-center px-1.5 h-4 text-[8px] font-mono font-bold uppercase tracking-wider rounded-sm z-10 backdrop-blur-sm transition-all ${hasAlt
                            ? 'bg-emerald-500/85 text-white hover:bg-emerald-500'
                            : 'bg-black/50 text-white mix-blend-difference hover:bg-black/70'
                            }`}
                    >{t("richTextExtensions.alt")}</button>
                )}
            </div>

            {/* Edit popover: anchored where the badge sits, on the wrapper (not
                the image's own `overflow-hidden` box) so it is never clipped by
                a small image, and opens right there instead of moving the user's
                attention somewhere else on the page. */}
            {isEditing && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-1.5 right-1.5 w-60 bg-background border border-border/60 shadow-xl rounded-lg p-3 z-20 space-y-2"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">{t("richTextExtensions.alt-szoveg")}</span>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-muted-foreground/60 hover:text-foreground transition-colors -mr-1"
                            title={t("richTextExtensions.megse-esc")}
                        >
                            <X size={13} />
                        </button>
                    </div>
                    <input
                        type="text"
                        autoFocus
                        value={tempAlt}
                        onChange={(e) => setTempAlt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("richTextExtensions.kep-leirasa-seo-and-akadalymentesites")}
                        className="w-full bg-background border border-border/60 rounded px-2 py-1.5 text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10 transition-all"
                    />
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => handleSaveAlt()}
                            className="flex-1 px-2 py-1 bg-foreground/10 hover:bg-foreground/15 border border-border/60 text-muted-foreground hover:text-foreground text-[10px] font-mono uppercase tracking-wider rounded transition-colors"
                            title={t("richTextExtensions.mentes-enter")}
                        >{t("richTextExtensions.mentes")}</button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 px-2 py-1 bg-muted/20 hover:bg-muted/30 border border-border/60 text-muted-foreground hover:text-foreground text-[10px] font-mono uppercase tracking-wider rounded transition-colors"
                            title={t("richTextExtensions.megse-esc")}
                        >{t("richTextExtensions.megse")}</button>
                    </div>
                </div>
            )}
        </NodeViewWrapper>
    );
}

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
                    if (explicitAlt !== null && explicitAlt !== undefined && explicitAlt.trim() !== '') {
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
                }
            },
            title: {
                default: null,
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(RichTextImageNode);
    },
});

export interface VideoOptions {
    HTMLAttributes: Record<string, any>;
}

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
                    if (explicitAlt !== null && explicitAlt !== undefined && explicitAlt.trim() !== '') {
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
                }
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
        return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },

    addCommands() {
        return {
            setVideo: (options: { src: string; alt?: string }) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});

export interface AudioOptions {
    HTMLAttributes: Record<string, any>;
}

export const Audio = Node.create<AudioOptions>({
    name: 'audio',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'w-full my-4',
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
                    if (explicitAlt !== null && explicitAlt !== undefined && explicitAlt.trim() !== '') {
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
                }
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'audio[src]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['audio', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },

    addCommands() {
        return {
            setAudio: (options: { src: string; alt?: string }) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});

export interface CoordinatesOptions {
    HTMLAttributes: Record<string, any>;
}

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
            setCoordinates: (options: { lat: string; lng: string }) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});

export const CustomTable = Table.extend({
    name: 'table',
    addOptions() {
        return {
            ...(this.parent?.() || {}),
            resizable: true,
            lastColumnResizable: true,
            renderWrapper: false,
            HTMLAttributes: {
                class: 'nomad-table w-full my-4 border-collapse text-xs border border-border',
            },
        } as any;
    },
    addCommands() {
        return {
            ...this.parent?.(),
            insertNomadTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ({ commands }) => {
                return commands.insertTable({
                    rows: options?.rows ?? 3,
                    cols: options?.cols ?? 3,
                    withHeaderRow: options?.withHeaderRow ?? true,
                });
            },
        };
    },
});

export const CustomTableRow = TableRow.extend({
    name: 'tableRow',
});

export const CustomTableHeader = TableHeader.extend({
    name: 'tableHeader',
    addOptions() {
        return {
            ...this.parent?.(),
            HTMLAttributes: {
                class: 'border border-border bg-secondary/30 px-3 py-2 text-left font-semibold text-foreground',
            },
        };
    },
});

export const CustomTableCell = TableCell.extend({
    name: 'tableCell',
    addOptions() {
        return {
            ...this.parent?.(),
            HTMLAttributes: {
                class: 'border border-border px-3 py-2 text-foreground align-top',
            },
        };
    },
});

interface MathSymbol {
    label: string;
    latex: string;
    tooltip: string;
}

interface MathCategory {
    id: string;
    title: string;
    symbols: MathSymbol[];
}

const MATH_CATEGORIES: MathCategory[] = [
    {
        id: 'basic',
        title: 'Műveletek',
        symbols: [
            { label: 'a/b', latex: '\\frac{a}{b}', tooltip: 'Tört (\\frac{a}{b})' },
            { label: '√x', latex: '\\sqrt{x}', tooltip: 'Négyzetgyök (\\sqrt{x})' },
            { label: 'ⁿ√x', latex: '\\sqrt[n]{x}', tooltip: 'n-edik gyök (\\sqrt[n]{x})' },
            { label: 'xⁿ', latex: 'x^{n}', tooltip: 'Felső index / hatvány (x^{n})' },
            { label: 'xᵢ', latex: 'x_{i}', tooltip: 'Alsó index (x_{i})' },
            { label: '·', latex: '\\cdot ', tooltip: 'Szorzópont (\\cdot)' },
            { label: '×', latex: '\\times ', tooltip: 'Szorzáskereszt (\\times)' },
            { label: '÷', latex: '\\div ', tooltip: 'Osztás (\\div)' },
            { label: '±', latex: '\\pm ', tooltip: 'Plusz-mínusz (\\pm)' },
            { label: '∓', latex: '\\mp ', tooltip: 'Mínusz-plusz (\\mp)' },
            { label: '∞', latex: '\\infty ', tooltip: 'Végtelen (\\infty)' },
        ],
    },
    {
        id: 'calculus',
        title: 'Szumma & Kalkulus',
        symbols: [
            { label: '∑', latex: '\\sum_{t=1}^{T} ', tooltip: 'Szumma indexekkel (\\sum_{t=1}^{T})' },
            { label: '∏', latex: '\\prod_{i=1}^{n} ', tooltip: 'Produktum (\\prod_{i=1}^{n})' },
            { label: '∫', latex: '\\int_{a}^{b} f(x)\\,dx ', tooltip: 'Határozott integrál (\\int_{a}^{b})' },
            { label: '∬', latex: '\\iint ', tooltip: 'Kettős integrál (\\iint)' },
            { label: 'lim', latex: '\\lim_{x \\to \\infty} ', tooltip: 'Limesz (\\lim_{x \\to \\infty})' },
            { label: '∂', latex: '\\partial ', tooltip: 'Parciális derivált (\\partial)' },
            { label: 'df/dx', latex: '\\frac{df}{dx}', tooltip: 'Derivált tört alakban' },
            { label: 'Δ', latex: '\\Delta ', tooltip: 'Delta differencia (\\Delta)' },
            { label: '∇', latex: '\\nabla ', tooltip: 'Nabla / gradiens (\\nabla)' },
            { label: 'v⃗', latex: '\\vec{v}', tooltip: 'Vektor (\\vec{v})' },
        ],
    },
    {
        id: 'greek',
        title: 'Görög betűk',
        symbols: [
            { label: 'α', latex: '\\alpha ', tooltip: 'Alfa (\\alpha)' },
            { label: 'β', latex: '\\beta ', tooltip: 'Béta (\\beta)' },
            { label: 'γ', latex: '\\gamma ', tooltip: 'Gamma (\\gamma)' },
            { label: 'δ', latex: '\\delta ', tooltip: 'Delta (\\delta)' },
            { label: 'ε', latex: '\\epsilon ', tooltip: 'Epszilon (\\epsilon)' },
            { label: 'θ', latex: '\\theta ', tooltip: 'Téta (\\theta)' },
            { label: 'λ', latex: '\\lambda ', tooltip: 'Lambda (\\lambda)' },
            { label: 'μ', latex: '\\mu ', tooltip: 'Mü (\\mu)' },
            { label: 'π', latex: '\\pi ', tooltip: 'Pí (\\pi)' },
            { label: 'ρ', latex: '\\rho ', tooltip: 'Ró (\\rho)' },
            { label: 'σ', latex: '\\sigma ', tooltip: 'Szigma (\\sigma)' },
            { label: 'φ', latex: '\\phi ', tooltip: 'Fí (\\phi)' },
            { label: 'ω', latex: '\\omega ', tooltip: 'Omega (\\omega)' },
            { label: 'Ω', latex: '\\Omega ', tooltip: 'Nagy Omega (\\Omega)' },
        ],
    },
    {
        id: 'brackets_relations',
        title: 'Zárójelek & Relációk',
        symbols: [
            { label: '( · )', latex: '\\left( x \\right) ', tooltip: 'Dinamikus kerek zárójel' },
            { label: '[ · ]', latex: '\\left[ x \\right] ', tooltip: 'Dinamikus szögletes zárójel' },
            { label: '{ · }', latex: '\\left\\{ x \\right\\} ', tooltip: 'Dinamikus kapcsos zárójel' },
            { label: '| · |', latex: '\\left| x \\right| ', tooltip: 'Abszolút érték' },
            { label: '≤', latex: '\\le ', tooltip: 'Kisebb vagy egyenlő (\\le)' },
            { label: '≥', latex: '\\ge ', tooltip: 'Nagyobb vagy egyenlő (\\ge)' },
            { label: '≠', latex: '\\neq ', tooltip: 'Nem egyenlő (\\neq)' },
            { label: '≈', latex: '\\approx ', tooltip: 'Megközelítőleg (\\approx)' },
            { label: '→', latex: '\\rightarrow ', tooltip: 'Jobbra mutató nyíl (\\rightarrow)' },
            { label: '⇒', latex: '\\Rightarrow ', tooltip: 'Következtetés nyíl (\\Rightarrow)' },
            { label: '\\text{ }', latex: '\\text{szöveg} ', tooltip: 'Normál szöveg képletben (\\text{...})' },
            { label: 'min', latex: '\\min ', tooltip: 'Minimum (\\min)' },
            { label: 'max', latex: '\\max ', tooltip: 'Maximum (\\max)' },
        ],
    },
];

export function MathFormulaNode({ node, updateAttributes, deleteNode, selected, editor, getPos }: any) {
    const { t } = useTranslation(["editor", "common"]);
    const { latex = '', display = true } = node.attrs;
    const [isEditing, setIsEditing] = useState(!latex);
    const [tempLatex, setTempLatex] = useState(latex || '');
    const [tempDisplay, setTempDisplay] = useState(display !== false);
    const [activeCategory, setActiveCategory] = useState<string>('basic');
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync state if props change externally
    useEffect(() => {
        setTempLatex(latex || '');
        setTempDisplay(display !== false);
    }, [latex, display]);

    // Reliable autofocus when editor opens
    useEffect(() => {
        if (isEditing) {
            const timer = setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    const len = textareaRef.current.value.length;
                    textareaRef.current.setSelectionRange(len, len);
                }
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isEditing]);

    const { previewHtml, hasError, errorMessage } = useMemo(() => {
        if (!tempLatex.trim()) {
            return { previewHtml: '', hasError: false, errorMessage: '' };
        }
        try {
            const html = katex.renderToString(tempLatex, {
                displayMode: tempDisplay,
                output: 'html',
                throwOnError: true,
            });
            return { previewHtml: html, hasError: false, errorMessage: '' };
        } catch (err: any) {
            try {
                const fallback = katex.renderToString(tempLatex, {
                    displayMode: tempDisplay,
                    output: 'html',
                    throwOnError: false,
                });
                return { previewHtml: fallback, hasError: true, errorMessage: err?.message || 'LaTeX szintaktikai hiba' };
            } catch {
                return { previewHtml: '', hasError: true, errorMessage: err?.message || 'LaTeX szintaktikai hiba' };
            }
        }
    }, [tempLatex, tempDisplay]);

    const renderedHtml = useMemo(() => {
        if (!latex) return '';
        try {
            return katex.renderToString(latex, {
                displayMode: display !== false,
                output: 'html',
                throwOnError: false,
            });
        } catch {
            return latex;
        }
    }, [latex, display]);

    const handleSave = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = tempLatex.trim();
        if (!trimmed) {
            deleteNode?.();
            return;
        }

        // If user chose Inline mode, convert to an actual InlineMath node inside text
        if (!tempDisplay && editor && typeof getPos === 'function') {
            const pos = getPos();
            if (typeof pos === 'number') {
                editor.chain().focus().setNodeSelection(pos).deleteSelection().insertContent({
                    type: 'inlineMath',
                    attrs: { latex: trimmed },
                }).run();
                return;
            }
        }

        updateAttributes({
            latex: trimmed,
            display: tempDisplay,
        });
        setIsEditing(false);
    };

    const handleInsertSnippet = (snippet: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setTempLatex((prev: string) => prev + snippet);
            return;
        }
        const start = textarea.selectionStart ?? tempLatex.length;
        const end = textarea.selectionEnd ?? tempLatex.length;
        const selectedText = tempLatex.slice(start, end);
        let insertion = snippet;
        let newCursorPos = start + snippet.length;

        if (selectedText) {
            if (snippet.includes('{a}')) {
                insertion = snippet.replace('{a}', `{${selectedText}}`);
                newCursorPos = start + insertion.length;
            } else if (snippet.includes('{x}')) {
                insertion = snippet.replace('{x}', `{${selectedText}}`);
                newCursorPos = start + insertion.length;
            } else if (snippet.startsWith('\\left(') && snippet.endsWith('\\right) ')) {
                insertion = `\\left( ${selectedText} \\right) `;
                newCursorPos = start + insertion.length;
            } else if (snippet.startsWith('\\left[') && snippet.endsWith('\\right] ')) {
                insertion = `\\left[ ${selectedText} \\right] `;
                newCursorPos = start + insertion.length;
            } else {
                insertion = snippet + selectedText;
                newCursorPos = start + insertion.length;
            }
        } else {
            // Smart cursor position inside the first argument
            if (snippet.includes('{a}')) {
                newCursorPos = start + snippet.indexOf('{a}') + 1;
            } else if (snippet.includes('{x}')) {
                newCursorPos = start + snippet.indexOf('{x}') + 1;
            } else if (snippet.includes('{n}')) {
                newCursorPos = start + snippet.indexOf('{n}') + 1;
            } else if (snippet.indexOf('{}') !== -1) {
                newCursorPos = start + snippet.indexOf('{}') + 1;
            }
        }

        const next = tempLatex.slice(0, start) + insertion + tempLatex.slice(end);
        setTempLatex(next);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (!latex) {
                deleteNode?.();
            } else {
                setTempLatex(latex);
                setTempDisplay(display);
                setIsEditing(false);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const next = tempLatex.slice(0, start) + '  ' + tempLatex.slice(end);
                setTempLatex(next);
                setTimeout(() => {
                    textarea.setSelectionRange(start + 2, start + 2);
                }, 0);
            }
        }
    };

    const handleCopyLatex = () => {
        const textToCopy = tempLatex || latex;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const currentCategory = MATH_CATEGORIES.find((c) => c.id === activeCategory) || MATH_CATEGORIES[0];

    return (
        <NodeViewWrapper
            as={display ? "div" : "span"}
            className={display ? "relative my-4 block group/math max-w-full select-none" : "inline-block align-baseline group/math select-none"}
            contentEditable={false}
        >
            {!isEditing ? (
                display ? (
                    <div
                        onClick={() => setIsEditing(true)}
                        className={`relative p-5 rounded-xl border transition-all cursor-pointer select-none overflow-x-auto ${selected
                            ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md'
                            : 'border-border/70 bg-secondary/5 hover:border-primary/40 hover:bg-secondary/15 hover:shadow-xs'
                            }`}
                    >
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover/math:opacity-100 transition-opacity bg-background/90 backdrop-blur-xs p-1 rounded-lg border border-border/60 shadow-sm">
                            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground font-semibold">
                                LaTeX
                            </span>
                            {latex && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyLatex();
                                    }}
                                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                    title={copied ? (t('math.masolva') || 'Másolva!') : (t('math.masolas') || 'LaTeX másolása')}
                                >
                                    {copied ? <CheckCheck size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title={t('math.szerkesztes') || 'Képlet szerkesztése'}
                            >
                                <Edit3 size={12} />
                            </button>
                        </div>
                        {renderedHtml ? (
                            <div
                                className="text-foreground text-center py-2 text-lg"
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        ) : (
                            <div className="text-center text-xs text-muted-foreground/60 italic py-2 flex items-center justify-center gap-1.5">
                                <Sigma size={14} className="opacity-40" />
                                {t('math.ures-keplet') || 'Üres képlet — kattints a szerkesztéshez'}
                            </div>
                        )}
                    </div>
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        title={t('math.szerkesztes') || 'Képlet szerkesztése'}
                        className={`inline-flex items-center align-baseline px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition-all border text-xs font-serif ${selected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/10'
                            : 'border-border/40 hover:border-primary/60 bg-muted/40 hover:bg-muted/70'
                            }`}
                    >
                        <span dangerouslySetInnerHTML={{ __html: renderedHtml }} className="pointer-events-none" />
                    </span>
                )
            ) : (
                <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    data-no-dnd="true"
                    className="p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl space-y-4 max-w-2xl mx-auto transition-all relative z-30"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                <Sigma size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold tracking-wide text-foreground">
                                    {t('math.matematikai-keplet') || 'Matematikai képlet szerkesztő'}
                                </h4>
                                <p className="text-[10px] text-muted-foreground font-mono">{t('math.latex-szintaxis') || 'KaTeX / LaTeX szintaxis'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Segmented display mode toggle */}
                            <div className="flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border">
                                <button
                                    type="button"
                                    onClick={() => setTempDisplay(true)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${tempDisplay
                                        ? 'bg-card text-foreground border border-border/80 font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title={t('math.blokk-desc') || 'Külön sorban, középre igazítva'}
                                >
                                    <AlignJustify size={12} />
                                    <span>{t('math.blokk') || 'Blokk'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempDisplay(false)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${!tempDisplay
                                        ? 'bg-card text-foreground border border-border/80 font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title={t('math.inline-desc') || 'Folyószövegbe ágyazva'}
                                >
                                    <Columns size={12} />
                                    <span>{t('math.inline') || 'Inline'}</span>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!latex) deleteNode?.();
                                    else setIsEditing(false);
                                }}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                                {t('math.latex-kod', 'LaTeX kifejezés')}
                            </label>
                            <div className="flex items-center gap-3">
                                {tempLatex.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => setTempLatex('')}
                                        className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <RotateCcw size={10} />
                                        {t('math.urites', 'Mező törlése')}
                                    </button>
                                )}
                                <span className="text-[10px] text-muted-foreground/60 font-mono">
                                    {t('math.mentes-billentyu', 'Ctrl+Enter a mentéshez')}
                                </span>
                            </div>
                        </div>
                        <textarea
                            ref={textareaRef}
                            autoFocus
                            rows={3}
                            value={tempLatex}
                            onChange={(e) => setTempLatex(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('math.placeholder', 'pl. E = m c^2  vagy  \\min J = \\sum_{t=1}^T (P_t \\cdot \\lambda_t)')}
                            className="w-full bg-background text-foreground placeholder:text-muted-foreground/60 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-3 text-xs font-mono leading-relaxed outline-none transition-all resize-y min-h-[84px] shadow-2xs"
                            spellCheck={false}
                        />
                    </div>

                    {/* Live Preview Box */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                                <Eye size={13} className="text-primary" />
                                {t('math.elonezet', 'Preview')}
                            </label>
                            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary/50 border border-border">
                                {tempDisplay ? t('math.display-blokk', 'displayMode: blokk') : t('math.display-inline', 'displayMode: inline')}
                            </span>
                        </div>
                        <div className="min-h-[64px] p-4 rounded-xl border border-border bg-secondary/20 text-foreground flex items-center justify-center overflow-x-auto shadow-inner">
                            {previewHtml ? (
                                <div
                                    className={`text-foreground ${tempDisplay ? 'text-center text-lg py-1' : 'inline-block text-base'}`}
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            ) : (
                                <span className="text-xs text-muted-foreground/60 italic flex items-center gap-1.5 select-none font-sans">
                                    <Sigma size={14} className="opacity-40" />
                                    {t('math.nincs-elonezet', 'Írj be egy kifejezést, vagy válassz az alábbi szimbólumok közül...')}
                                </span>
                            )}
                        </div>
                        {hasError && errorMessage && (
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                                <span>⚠</span>
                                <span className="font-mono text-[11px]">{errorMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Symbol & Template Palette Tabs */}
                    <div className="space-y-2 pt-1 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 p-0.5 bg-secondary/50 border border-border rounded-lg overflow-x-auto custom-scrollbar">
                                {MATH_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${activeCategory === cat.id
                                            ? 'bg-card text-foreground border border-border/80 shadow-2xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                            }`}
                                    >
                                        {t(`math.kategoriak.${cat.id}`, cat.title)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-secondary/20 rounded-xl border border-border max-h-32 overflow-y-auto custom-scrollbar">
                            {currentCategory.symbols.map((sym, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleInsertSnippet(sym.latex)}
                                    className="min-w-[36px] h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/60 text-foreground font-mono text-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                                    title={sym.tooltip}
                                >
                                    {sym.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div>
                            {deleteNode && (
                                <button
                                    type="button"
                                    onClick={() => deleteNode()}
                                    className="px-2.5 py-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                    {t('math.torles', 'Törlés')}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {tempLatex.trim() && (
                                <button
                                    type="button"
                                    onClick={handleCopyLatex}
                                    className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-foreground border border-border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    title={t('math.masolas', 'LaTeX másolása vágólapra')}
                                >
                                    {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                    {copied ? t('math.masolva', 'Másolva!') : t('math.masolas', 'LaTeX másolása')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!latex) deleteNode?.();
                                    else setIsEditing(false);
                                }}
                                className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                            >
                                {t('math.megse', 'Mégse')}
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!tempLatex.trim()}
                                className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                                <Check size={14} />
                                {t('math.mentes', 'Mentés')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </NodeViewWrapper>
    );
}

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
        let mathHtml = '';
        try {
            mathHtml = katex.renderToString(latex, {
                displayMode: display,
                output: 'html',
                throwOnError: false,
            });
        } catch {
            mathHtml = latex;
        }

        if (typeof document !== 'undefined') {
            const dom = document.createElement(display ? 'div' : 'span');
            dom.setAttribute('data-type', 'math-formula');
            dom.setAttribute('data-latex', latex);
            dom.setAttribute('data-display', display ? 'true' : 'false');
            dom.className = 'nomad-math-formula my-4 py-2 text-center overflow-x-auto select-none';
            dom.innerHTML = mathHtml;
            return dom;
        }

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
        return ReactNodeViewRenderer(MathFormulaNode);
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

export interface PageBreakOptions {
    HTMLAttributes: Record<string, any>;
}

export const PageBreak = Node.create<PageBreakOptions>({
    name: 'pageBreak',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    parseHTML() {
        return [
            { tag: 'div[data-type="page-break"]' },
            { tag: 'div.page-break-node' },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'page-break',
                class: 'page-break-node',
            }),
        ];
    },

    addCommands() {
        return {
            setPageBreak: () => ({ chain }) => {
                return chain()
                    .insertContent([
                        { type: this.name },
                        { type: 'paragraph' },
                    ])
                    .run();
            },
        };
    },
});

// ==========================================
// CODE BLOCK EXTENSION WITH LANGUAGE SELECTION & FORMATTING
// ==========================================

export const SUPPORTED_CODE_LANGUAGES = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'python', label: 'Python' },
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'json', label: 'JSON' },
    { id: 'sql', label: 'SQL' },
    { id: 'bash', label: 'Bash / Shell' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' },
    { id: 'csharp', label: 'C#' },
    { id: 'php', label: 'PHP' },
    { id: 'yaml', label: 'YAML' },
    { id: 'markdown', label: 'Markdown' },
    { id: 'graphql', label: 'GraphQL' },
    { id: 'xml', label: 'XML' },
    { id: 'plaintext', label: 'Plain Text' },
];

export function CodeBlockComponent({ node, updateAttributes, deleteNode, selected }: any) {
    const { t } = useTranslation(["editor", "common"]);
    const { language = 'javascript', wrapLines = false } = node.attrs;
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = node.textContent;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleToggleWrap = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateAttributes({ wrapLines: !wrapLines });
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateAttributes({ language: e.target.value });
    };

    return (
        <NodeViewWrapper className={`nomad-code-block not-prose my-4 rounded-xl overflow-hidden border transition-all ${selected ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-border shadow-xs'
            } bg-card text-card-foreground`}>
            {/* Top Toolbar / Header Bar */}
            <div
                className="flex items-center justify-between px-3.5 py-2 bg-secondary/35 border-b border-border text-xs font-mono select-none"
                contentEditable={false}
            >
                {/* Left: Window Dots & Language Selector */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-2xs border border-[#e0443e]/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-2xs border border-[#dea123]/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-2xs border border-[#1aab29]/30" />
                    </div>

                    <div className="h-3.5 w-px bg-border" />

                    <div className="relative flex items-center">
                        <Code2 size={13} className="absolute left-2.5 text-muted-foreground pointer-events-none" />
                        <select
                            value={language}
                            onChange={handleLanguageChange}
                            aria-label={t('codeBlock.language', 'Programozási nyelv')}
                            className="appearance-none bg-background hover:bg-secondary/60 text-foreground rounded-lg pl-7 pr-7 py-1 text-xs font-mono border border-border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all shadow-2xs"
                        >
                            {SUPPORTED_CODE_LANGUAGES.map(lang => (
                                <option key={lang.id} value={lang.id} className="bg-popover text-popover-foreground">
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* Right: Controls (Wrap lines, Copy code, Delete block) */}
                <div className="flex items-center gap-1.5">
                    {/* Line Wrap Toggle */}
                    <button
                        type="button"
                        onClick={handleToggleWrap}
                        title={wrapLines ? t('codeBlock.disableWrap', 'Sortörés kikapcsolása') : t('codeBlock.enableWrap', 'Sortörés bekapcsolása')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${wrapLines
                            ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground bg-background hover:bg-secondary/60 border-border shadow-2xs'
                            }`}
                    >
                        <WrapText size={12} />
                        <span className="hidden sm:inline">{wrapLines ? t('codeBlock.wrapped', 'Tört sorok') : t('codeBlock.wrap', 'Sortörés')}</span>
                    </button>

                    {/* Copy Button */}
                    <button
                        type="button"
                        onClick={handleCopy}
                        title={t('codeBlock.copy', 'Kód másolása')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${copied
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                            : 'text-muted-foreground hover:text-foreground bg-background hover:bg-secondary/60 border-border shadow-2xs'
                            }`}
                    >
                        {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                        <span>{copied ? t('codeBlock.copied', 'Másolva!') : t('codeBlock.copy', 'Másolás')}</span>
                    </button>

                    {/* Delete Block */}
                    {deleteNode && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteNode(); }}
                            title={t('codeBlock.delete', 'Kódblokk törlése')}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Code Body with ProseMirror content */}
            <pre className={`!bg-secondary/15 dark:!bg-background/80 !p-4 !m-0 !border-0 font-mono text-[13px] leading-relaxed text-foreground select-text selection:bg-primary/20 ${wrapLines ? '!whitespace-pre-wrap break-words' : '!whitespace-pre overflow-x-auto custom-scrollbar'
                }`}>
                <NodeViewContent as={"code" as any} className={language ? `language-${language} !bg-transparent !p-0 !text-foreground` : '!bg-transparent !p-0 !text-foreground'} />
            </pre>
        </NodeViewWrapper>
    );
}

export interface CustomCodeBlockOptions {
    HTMLAttributes?: Record<string, any>;
}

export const CustomCodeBlock = CodeBlock.extend<CustomCodeBlockOptions>({
    name: 'codeBlock',

    addAttributes() {
        return {
            ...this.parent?.(),
            language: {
                default: 'javascript',
                parseHTML: element => {
                    const dataLang = element.getAttribute('data-language');
                    if (dataLang) return dataLang;
                    const codeEl = element.querySelector('code');
                    if (codeEl) {
                        const match = codeEl.className.match(/language-([a-z0-9_-]+)/i);
                        if (match) return match[1];
                    }
                    return 'javascript';
                },
                renderHTML: attributes => ({
                    'data-language': attributes.language || 'javascript',
                }),
            },
            wrapLines: {
                default: false,
                parseHTML: element => element.getAttribute('data-wrap') === 'true',
                renderHTML: attributes => ({
                    'data-wrap': attributes.wrapLines ? 'true' : 'false',
                }),
            },
        };
    },

    renderHTML({ node, HTMLAttributes }) {
        const lang = node.attrs.language || 'javascript';
        const wrap = node.attrs.wrapLines ? 'true' : 'false';
        return [
            'pre',
            mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes, {
                'data-language': lang,
                'data-wrap': wrap,
                class: `nomad-code-block rounded-lg p-4 font-mono text-xs bg-zinc-950 text-zinc-100 ${node.attrs.wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'}`,
            }),
            [
                'code',
                {
                    class: lang ? `language-${lang}` : undefined,
                    'data-language': lang,
                },
                0,
            ],
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockComponent);
    },
});

// ==========================================
// INLINE MATH CHARACTER & FORMULA EXTENSION
// ==========================================

const INLINE_GREEK_SYMBOLS = [
    { label: 'α', latex: '\\alpha ', tooltip: 'alpha (\\alpha)' },
    { label: 'β', latex: '\\beta ', tooltip: 'beta (\\beta)' },
    { label: 'γ', latex: '\\gamma ', tooltip: 'gamma (\\gamma)' },
    { label: 'δ', latex: '\\delta ', tooltip: 'delta (\\delta)' },
    { label: 'ε', latex: '\\epsilon ', tooltip: 'epsilon (\\epsilon)' },
    { label: 'θ', latex: '\\theta ', tooltip: 'theta (\\theta)' },
    { label: 'λ', latex: '\\lambda ', tooltip: 'lambda (\\lambda)' },
    { label: 'μ', latex: '\\mu ', tooltip: 'mu (\\mu)' },
    { label: 'π', latex: '\\pi ', tooltip: 'pi (\\pi)' },
    { label: 'ρ', latex: '\\rho ', tooltip: 'rho (\\rho)' },
    { label: 'σ', latex: '\\sigma ', tooltip: 'sigma (\\sigma)' },
    { label: 'τ', latex: '\\tau ', tooltip: 'tau (\\tau)' },
    { label: 'φ', latex: '\\phi ', tooltip: 'phi (\\phi)' },
    { label: 'ω', latex: '\\omega ', tooltip: 'omega (\\omega)' },
    { label: 'Δ', latex: '\\Delta ', tooltip: 'Delta (\\Delta)' },
    { label: 'Σ', latex: '\\Sigma ', tooltip: 'Sigma (\\Sigma)' },
    { label: 'Ω', latex: '\\Omega ', tooltip: 'Omega (\\Omega)' },
];

const INLINE_FORMAT_SYMBOLS = [
    { label: 'xᵢ', latex: '_{t}', tooltip: 'Alsó index (_{t})' },
    { label: 'x²', latex: '^{2}', tooltip: 'Felső index (^{2})' },
    { label: 'txt', latex: '\\text{grid}', tooltip: 'Szöveg (\\text{grid})' },
    { label: 'a/b', latex: '\\frac{a}{b}', tooltip: 'Tört (\\frac{a}{b})' },
    { label: '√x', latex: '\\sqrt{x}', tooltip: 'Gyök (\\sqrt{x})' },
    { label: 'x̄', latex: '\\bar{x}', tooltip: 'Vonás (\\bar{x})' },
    { label: 'x̂', latex: '\\hat{x}', tooltip: 'Kalap (\\hat{x})' },
    { label: 'x⃗', latex: '\\vec{x}', tooltip: 'Vektor (\\vec{x})' },
    { label: '∑', latex: '\\sum_{i=1}^n ', tooltip: 'Összegzés (\\sum)' },
    { label: '∫', latex: '\\int ', tooltip: 'Integrál (\\int)' },
    { label: '∂', latex: '\\partial ', tooltip: 'Parciális (\\partial)' },
    { label: '∞', latex: '\\infty ', tooltip: 'Végtelen (\\infty)' },
];

const INLINE_OPERATOR_SYMBOLS = [
    { label: '≤', latex: '\\le ', tooltip: 'Kisebb vagy egyenlő (\\le)' },
    { label: '≥', latex: '\\ge ', tooltip: 'Nagyobb vagy egyenlő (\\ge)' },
    { label: '≠', latex: '\\neq ', tooltip: 'Nem egyenlő (\\neq)' },
    { label: '≈', latex: '\\approx ', tooltip: 'Közelítőleg egyenlő (\\approx)' },
    { label: '±', latex: '\\pm ', tooltip: 'Plusz-mínusz (\\pm)' },
    { label: '×', latex: '\\times ', tooltip: 'Szorzás (\\times)' },
    { label: '÷', latex: '\\div ', tooltip: 'Osztás (\\div)' },
    { label: '·', latex: '\\cdot ', tooltip: 'Szorzópont (\\cdot)' },
    { label: '∈', latex: '\\in ', tooltip: 'Eleme (\\in)' },
    { label: '∉', latex: '\\notin ', tooltip: 'Nem eleme (\\notin)' },
    { label: '⊂', latex: '\\subset ', tooltip: 'Részhalmaza (\\subset)' },
    { label: '→', latex: '\\rightarrow ', tooltip: 'Nyíl jobbra (\\rightarrow)' },
];

export function InlineMathNodeView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps | NodeViewProps) {
    const { t } = useTranslation(["editor", "common"]);
    const { latex = '' } = node.attrs;
    const [isEditing, setIsEditing] = useState(!latex);
    const [tempLatex, setTempLatex] = useState(latex || '');
    const [category, setCategory] = useState<'greek' | 'formats' | 'operators'>('greek');
    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties | null>(null);

    // Sync state on external update
    useEffect(() => {
        setTempLatex(latex || '');
    }, [latex]);

    // Calculate position for portal
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const POPOVER_WIDTH = 380;
        const POPOVER_HEIGHT = 460;
        const GAP = 8;
        const VIEWPORT_MARGIN = 12;

        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward = spaceBelow < 380 && spaceAbove > spaceBelow;

        const maxAvailableHeight = openUpward
            ? Math.max(280, spaceAbove - GAP - VIEWPORT_MARGIN)
            : Math.max(280, spaceBelow - GAP - VIEWPORT_MARGIN);

        const style: React.CSSProperties = {
            position: 'fixed',
            zIndex: 999999, // ALWAYS ON VERY TOP OF EVERYTHING!
            width: `${Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)}px`,
            maxHeight: `${Math.min(POPOVER_HEIGHT, maxAvailableHeight)}px`,
        };

        if (openUpward) {
            style.bottom = `${window.innerHeight - rect.top + GAP}px`;
        } else {
            style.top = `${rect.bottom + GAP}px`;
        }

        let left = rect.left;
        if (left + POPOVER_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
            left = Math.max(VIEWPORT_MARGIN, window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN);
        }
        style.left = `${left}px`;

        setPopoverStyle(style);
    }, []);

    // Update position on open, scroll or resize
    useEffect(() => {
        if (!isEditing) return;
        updatePosition();

        const handleScrollOrResize = () => {
            updatePosition();
        };
        window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isEditing, updatePosition]);

    // Reliable autofocus when popover opens
    useEffect(() => {
        if (isEditing) {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isEditing]);

    // Handle outside click
    useEffect(() => {
        if (!isEditing) return;
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as globalThis.Node;
            if (
                popoverRef.current && !popoverRef.current.contains(target) &&
                triggerRef.current && !triggerRef.current.contains(target)
            ) {
                if (!latex && !tempLatex.trim()) {
                    deleteNode?.();
                } else if (tempLatex.trim()) {
                    updateAttributes({ latex: tempLatex.trim() });
                    setIsEditing(false);
                } else {
                    setIsEditing(false);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing, tempLatex, latex, deleteNode, updateAttributes]);

    // Rendered KaTeX HTML for inline text view
    const renderedHtml = useMemo(() => {
        if (!latex) return '';
        try {
            return katex.renderToString(latex, {
                displayMode: false,
                output: 'html',
                throwOnError: false,
            });
        } catch {
            return latex;
        }
    }, [latex]);

    // KaTeX preview for the popover
    const { previewHtml, hasError, errorMessage } = useMemo(() => {
        if (!tempLatex.trim()) {
            return { previewHtml: '', hasError: false, errorMessage: '' };
        }
        try {
            const html = katex.renderToString(tempLatex, {
                displayMode: false,
                output: 'html',
                throwOnError: true,
            });
            return { previewHtml: html, hasError: false, errorMessage: '' };
        } catch (err: any) {
            try {
                const fallback = katex.renderToString(tempLatex, {
                    displayMode: false,
                    output: 'html',
                    throwOnError: false,
                });
                return { previewHtml: fallback, hasError: true, errorMessage: err?.message || 'Hiba a LaTeX szintaxisban' };
            } catch {
                return { previewHtml: '', hasError: true, errorMessage: err?.message || 'Hiba a LaTeX szintaxisban' };
            }
        }
    }, [tempLatex]);

    const handleSave = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = tempLatex.trim();
        if (!trimmed) {
            deleteNode?.();
            return;
        }
        updateAttributes({ latex: trimmed });
        setIsEditing(false);
    };

    const handleInsertSymbol = (symbolSnippet: string) => {
        const input = inputRef.current;
        if (!input) {
            setTempLatex((prev: string) => prev + symbolSnippet);
            return;
        }
        const start = input.selectionStart ?? tempLatex.length;
        const end = input.selectionEnd ?? tempLatex.length;
        const newText = tempLatex.slice(0, start) + symbolSnippet + tempLatex.slice(end);
        setTempLatex(newText);
        setTimeout(() => {
            input.focus();
            const newCursor = start + symbolSnippet.length;
            input.setSelectionRange(newCursor, newCursor);
        }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (!latex && !tempLatex.trim()) {
                deleteNode?.();
            } else {
                setTempLatex(latex || '');
                setIsEditing(false);
            }
        }
    };

    const currentSymbols = category === 'greek'
        ? INLINE_GREEK_SYMBOLS
        : category === 'formats'
            ? INLINE_FORMAT_SYMBOLS
            : INLINE_OPERATOR_SYMBOLS;

    return (
        <NodeViewWrapper as="span" className="inline-block relative leading-none select-none align-baseline">
            {/* Inline chip representation */}
            <span
                ref={triggerRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                title={t('inlineMath.clickToEdit', 'Kattints a matek karakter / képlet szerkesztéséhez')}
                className={`inline-flex items-center align-baseline px-1 py-0.5 mx-0.5 rounded cursor-pointer transition-all border text-xs font-serif ${selected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/10'
                    : 'border-border/40 hover:border-primary/60 bg-muted/40 hover:bg-muted/70'
                    } ${!latex ? 'text-amber-500 bg-amber-500/10 border-amber-500/40 font-mono text-[11px]' : ''}`}
            >
                {latex ? (
                    <span dangerouslySetInnerHTML={{ __html: renderedHtml }} className="pointer-events-none" />
                ) : (
                    <span className="font-mono text-[10px] uppercase font-semibold text-amber-500">
                        {t('inlineMath.new', '+ [matek]')}
                    </span>
                )}
            </span>

            {/* Floating popover editor rendered via Portal to be on the very top of everything in docs mode */}
            {isEditing && popoverStyle && typeof document !== 'undefined' && createPortal(
                <div
                    ref={popoverRef}
                    style={popoverStyle}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="fixed z-[999999] bg-popover text-popover-foreground border border-border shadow-2xl rounded-2xl p-3.5 select-none font-sans flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
                >
                    {/* Header (shrink-0) */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-border shrink-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Pi size={14} className="text-primary" />
                            <span>{t('inlineMath.title', 'Matek karakter / képlet')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {deleteNode && (
                                <button
                                    type="button"
                                    onClick={() => deleteNode()}
                                    title={t('inlineMath.delete', 'Törlés')}
                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!latex && !tempLatex.trim()) deleteNode?.();
                                    else setIsEditing(false);
                                }}
                                title={t('inlineMath.close', 'Bezárás (Esc)')}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Body (flex-1) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-2.5 py-1.5 pr-0.5">
                        {/* Quick Symbol Category Tabs */}
                        <div className="flex items-center gap-1 p-0.5 bg-secondary/50 border border-border rounded-lg text-[11px]">
                            <button
                                type="button"
                                onClick={() => setCategory('greek')}
                                className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${category === 'greek'
                                    ? 'bg-card text-foreground border border-border/80 font-semibold shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {t('inlineMath.greek', 'Görög betűk')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory('formats')}
                                className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${category === 'formats'
                                    ? 'bg-card text-foreground border border-border/80 font-semibold shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {t('inlineMath.formats', 'Gyakori & Indexek')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory('operators')}
                                className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${category === 'operators'
                                    ? 'bg-card text-foreground border border-border/80 font-semibold shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {t('inlineMath.operators', 'Operátorok')}
                            </button>
                        </div>

                        {/* Quick Symbol Grid */}
                        <div className="grid grid-cols-6 gap-1 p-1.5 bg-secondary/30 rounded-xl border border-border max-h-28 overflow-y-auto custom-scrollbar">
                            {currentSymbols.map((sym) => (
                                <button
                                    key={sym.latex}
                                    type="button"
                                    onClick={() => handleInsertSymbol(sym.latex)}
                                    title={sym.tooltip || sym.label}
                                    className="flex items-center justify-center h-7 px-1 rounded-lg bg-card hover:bg-secondary hover:border-primary/50 text-foreground border border-border/80 text-xs font-serif transition-all shadow-2xs cursor-pointer active:scale-95"
                                >
                                    {sym.label}
                                </button>
                            ))}
                        </div>

                        {/* Input Field */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-semibold">
                                LaTeX:
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={tempLatex}
                                onChange={(e) => setTempLatex(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="pl. P_{\text{grid}, t} vagy \lambda_t vagy \alpha"
                                className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none transition-all shadow-2xs"
                            />
                        </div>

                        {/* Live Preview */}
                        <div className="p-2 bg-secondary/20 border border-border rounded-xl min-h-[34px] flex items-center justify-center overflow-x-auto text-foreground">
                            {previewHtml ? (
                                <span dangerouslySetInnerHTML={{ __html: previewHtml }} className="text-sm font-serif text-foreground" />
                            ) : (
                                <span className="text-[11px] text-muted-foreground/70 italic font-sans">Preview...</span>
                            )}
                        </div>
                        {hasError && (
                            <div className="text-[10px] text-red-500 dark:text-red-400 font-mono">
                                {errorMessage}
                            </div>
                        )}
                    </div>

                    {/* Popover Footer Buttons (shrink-0, ALWAYS visible!) */}
                    <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-border shrink-0 mt-1">
                        <button
                            type="button"
                            onClick={() => {
                                if (!latex && !tempLatex.trim()) deleteNode?.();
                                else setIsEditing(false);
                            }}
                            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                        >
                            {t('inlineMath.cancel', 'Mégse')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!tempLatex.trim()}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium rounded-lg transition-all shadow-xs cursor-pointer"
                        >
                            <Check size={12} />
                            <span>{t('inlineMath.save', 'Beszúrás')}</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </NodeViewWrapper>
    );
}

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
        let mathHtml = '';
        try {
            mathHtml = katex.renderToString(latex, {
                displayMode: false,
                output: 'html',
                throwOnError: false,
            });
        } catch {
            mathHtml = latex;
        }

        if (typeof document !== 'undefined') {
            const dom = document.createElement('span');
            dom.setAttribute('data-type', 'inline-math');
            dom.setAttribute('data-latex', latex);
            dom.className = 'inline-math-node select-none cursor-pointer';
            dom.innerHTML = mathHtml;
            return dom;
        }

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

    addInputRules() {
        return [
            nodeInputRule({
                find: /(?:^|\s)\$([^$\n]+)\$$/,
                type: this.type,
                getAttributes: match => ({
                    latex: match[1],
                }),
            }),
        ];
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


