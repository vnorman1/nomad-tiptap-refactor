import { useTranslation } from "react-i18next";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { X, Sigma, Edit3, Check, Copy, CheckCheck, Eye, AlignJustify, Columns, RotateCcw, Trash2 } from 'lucide-react';
import katex from 'katex';
import { MATH_CATEGORIES } from './mathSymbols';
import { FloatingPanel } from '../shared/toolbar';

/**
 * MathFormulaNodeView
 * 
 * React component that renders a math formula node with:
 * - Live KaTeX preview while editing (debounced to 150ms)
 * - Keyboard shortcuts: Cmd+Enter to save, Escape to cancel/delete
 * - Display/inline mode toggle
 * - Symbol palette for inserting LaTeX snippets
 * - Portal-based floating editor with position recalculation on scroll/resize
 * 
 * **Requirements:**
 * - 4.1: Extract MathFormula into separate file
 * - 4.4: Open editor immediately on creation, cursor in LaTeX input
 * - 4.5: Debounce preview update to 150ms
 * - 4.12: Portal-based fixed positioning with recalc on scroll/resize
 * 
 * **Keyboard Handling (Requirements 4.7, 4.8, 4.9):**
 * - Cmd+Enter: update node latex and close editor
 * - Escape with empty current input: delete node
 * - Escape with non-empty current input: close without modifying
 */
export function MathFormulaNodeView(props: ReactNodeViewProps) {
    const { node, updateAttributes, deleteNode, selected, editor, getPos } = props;
    const { t } = useTranslation(["editor", "common"]);
    const { latex = '', display = true } = node.attrs;
    const [isEditing, setIsEditing] = useState(!latex);
    const [tempLatex, setTempLatex] = useState(latex || '');
    const [tempDisplay, setTempDisplay] = useState(display !== false);
    const [activeCategory, setActiveCategory] = useState<string>('basic');
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const nodeRef = useRef<HTMLDivElement>(null);
    
    // Portal positioning state
    const [editorPosition, setEditorPosition] = useState({ top: 0, left: 0 });
    
    // Debounced preview state (150ms)
    const [previewLatex, setPreviewLatex] = useState(tempLatex);
    const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync state if props change externally
    useEffect(() => {
        setTempLatex(latex || '');
        setTempDisplay(display !== false);
    }, [latex, display]);

    // Debounce preview updates to 150ms
    useEffect(() => {
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
        }
        previewTimeoutRef.current = setTimeout(() => {
            setPreviewLatex(tempLatex);
        }, 150);

        return () => {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
        };
    }, [tempLatex]);

    // Calculate portal position on scroll/resize
    const updateEditorPosition = () => {
        if (!nodeRef.current || !isEditing) return;
        const rect = nodeRef.current.getBoundingClientRect();
        setEditorPosition({
            top: rect.bottom + 8,
            left: Math.max(8, rect.left + rect.width / 2 - 200), // center with ~400px width
        });
    };

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

    // Set up scroll/resize listeners for portal positioning
    useEffect(() => {
        if (!isEditing) return;

        updateEditorPosition();
        
        // Use capture phase for scroll to catch it early
        window.addEventListener('scroll', updateEditorPosition, true);
        window.addEventListener('resize', updateEditorPosition);
        
        return () => {
            window.removeEventListener('scroll', updateEditorPosition, true);
            window.removeEventListener('resize', updateEditorPosition);
        };
    }, [isEditing]);

    // Compute preview with debounced latex
    const { previewHtml, hasError, errorMessage } = useMemo(() => {
        if (!previewLatex.trim()) {
            return { previewHtml: '', hasError: false, errorMessage: '' };
        }
        try {
            const html = katex.renderToString(previewLatex, {
                displayMode: tempDisplay,
                output: 'html',
                throwOnError: true,
            });
            return { previewHtml: html, hasError: false, errorMessage: '' };
        } catch (err: any) {
            try {
                const fallback = katex.renderToString(previewLatex, {
                    displayMode: tempDisplay,
                    output: 'html',
                    throwOnError: false,
                });
                return { previewHtml: fallback, hasError: true, errorMessage: err?.message || 'LaTeX szintaktikai hiba' };
            } catch {
                return { previewHtml: '', hasError: true, errorMessage: err?.message || 'LaTeX szintaktikai hiba' };
            }
        }
    }, [previewLatex, tempDisplay]);

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

    /**
     * handleSave - Save the current LaTeX to the node
     * 
     * If LaTeX is empty, delete the node instead.
     * If user chose Inline mode, convert to an actual InlineMath node inside text.
     */
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

    /**
     * handleInsertSnippet - Insert a LaTeX symbol or template at cursor position
     * 
     * Intelligently handles selection and cursor positioning within templates.
     */
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

    /**
     * handleKeyDown - Handle keyboard shortcuts in math editor
     * 
     * **Requirement 4.7**: Cmd+Enter (or Ctrl+Enter) saves the formula and closes editor
     * **Requirement 4.8**: Escape with empty current input deletes the node
     * **Requirement 4.9**: Escape with non-empty current input closes without modifying
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            // Cmd+Enter or Ctrl+Enter: save and close
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            // Escape: check current input, not original latex
            e.preventDefault();
            const currentInputTrimmed = tempLatex.trim();
            if (!currentInputTrimmed) {
                // Current input is empty, delete the node
                deleteNode?.();
            } else {
                // Current input has content, close without saving
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
            ref={nodeRef}
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
                                    title={copied ? (t('editor.richTextUpdate.math.copied') || 'Másolva!') : (t('editor.richTextUpdate.math.copy') || 'LaTeX másolása')}
                                >
                                    {copied ? <CheckCheck size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title={t('editor.richTextUpdate.math.edit') || 'Képlet szerkesztése'}
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
                                {t('editor.richTextUpdate.math.empty_formula') || 'Üres képlet — kattints a szerkesztéshez'}
                            </div>
                        )}
                    </div>
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        title={t('editor.richTextUpdate.math.edit') || 'Képlet szerkesztése'}
                        className={`inline-flex items-center align-baseline px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition-all border text-xs font-serif ${selected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/10'
                            : 'border-border/40 hover:border-primary/60 bg-muted/40 hover:bg-muted/70'
                            }`}
                    >
                        <span dangerouslySetInnerHTML={{ __html: renderedHtml }} className="pointer-events-none" />
                    </span>
                )
            ) : (
                isEditing && (
                    <FloatingPanel
                        position={{ top: editorPosition.top, left: editorPosition.left }}
                        style={{ maxWidth: '400px' }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            data-no-dnd="true"
                            className="p-5 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl space-y-4 transition-all relative z-30"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                        <Sigma size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold tracking-wide text-foreground">
                                            {t('editor.richTextUpdate.math.formula_editor') || 'Matematikai képlet szerkesztő'}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground font-mono">{t('editor.richTextUpdate.math.latex_syntax') || 'KaTeX / LaTeX szintaxis'}</p>
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
                                            title={t('editor.richTextUpdate.math.display_desc') || 'Külön sorban, középre igazítva'}
                                        >
                                            <AlignJustify size={12} />
                                            <span>{t('editor.richTextUpdate.math.display') || 'Blokk'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTempDisplay(false)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${!tempDisplay
                                                ? 'bg-card text-foreground border border-border/80 font-semibold shadow-2xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            title={t('editor.richTextUpdate.math.inline_desc') || 'Folyószövegbe ágyazva'}
                                        >
                                            <Columns size={12} />
                                            <span>{t('editor.richTextUpdate.math.inline') || 'Inline'}</span>
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
                                        {t('editor.richTextUpdate.math.latex_code', 'LaTeX kifejezés')}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        {tempLatex.trim() && (
                                            <button
                                                type="button"
                                                onClick={() => setTempLatex('')}
                                                className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
                                            >
                                                <RotateCcw size={10} />
                                                {t('editor.richTextUpdate.math.clear_field', 'Mező törlése')}
                                            </button>
                                        )}
                                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                                            {t('editor.richTextUpdate.math.save_shortcut', 'Ctrl+Enter a mentéshez')}
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
                                    placeholder={t('editor.richTextUpdate.math.placeholder', 'pl. E = m c^2  vagy  \\min J = \\sum_{t=1}^T (P_t \\cdot \\lambda_t)')}
                                    className="w-full bg-background text-foreground placeholder:text-muted-foreground/60 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-3 text-xs font-mono leading-relaxed outline-none transition-all resize-y min-h-[84px] shadow-2xs"
                                    spellCheck={false}
                                />
                            </div>

                            {/* Live Preview Box */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <Eye size={13} className="text-primary" />
                                        {t('editor.richTextUpdate.math.preview', 'Preview')}
                                    </label>
                                    <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary/50 border border-border">
                                        {tempDisplay ? t('editor.richTextUpdate.math.display_mode', 'displayMode: blokk') : t('editor.richTextUpdate.math.inline_mode', 'displayMode: inline')}
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
                                            {t('editor.richTextUpdate.math.no_preview', 'Írj be egy kifejezést, vagy válassz az alábbi szimbólumok közül...')}
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
                                                {t(`editor.richTextUpdate.math.categories.${cat.id}`, cat.title)}
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
                                            {t('editor.richTextUpdate.math.delete', 'Törlés')}
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {tempLatex.trim() && (
                                        <button
                                            type="button"
                                            onClick={handleCopyLatex}
                                            className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-foreground border border-border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                            title={t('editor.richTextUpdate.math.copy_latex', 'LaTeX másolása vágólapra')}
                                        >
                                            {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                            {copied ? t('editor.richTextUpdate.math.copied_label', 'Másolva!') : t('editor.richTextUpdate.math.copy_label', 'LaTeX másolása')}
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
                                        {t('editor.richTextUpdate.math.cancel', 'Mégse')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={!tempLatex.trim()}
                                        className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                    >
                                        <Check size={14} />
                                        {t('editor.richTextUpdate.math.save', 'Mentés')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </FloatingPanel>
                )
            )}
        </NodeViewWrapper>
    );
}
