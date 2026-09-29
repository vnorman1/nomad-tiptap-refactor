import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const MathNodeViewTemplate: React.FC<NodeViewProps> = ({
    node,
    updateAttributes,
    selected,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const formula = (node.attrs.formula as string) || '';
    const [tempFormula, setTempFormula] = useState(formula);
    const previewRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Szinkronizálás a külső állapottal
    useEffect(() => {
        setTempFormula(formula);
    }, [formula]);

    // KaTeX renderelés DOM-manipulációval (elkerüli a React reconciler hibákat)
    useEffect(() => {
        if (!isEditing && previewRef.current) {
            try {
                katex.render(
                    formula.trim() || '\\text{Kattints a szerkesztéshez...}',
                    previewRef.current,
                    {
                        displayMode: true,
                        throwOnError: false,
                    }
                );
            } catch (err) {
                previewRef.current.innerText = 'Érvénytelen LaTeX képlet';
            }
        }
    }, [formula, isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        updateAttributes({ formula: tempFormula });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Megakadályozzuk, hogy a Tiptap elnyelje a billentyűzet-eseményeket (pl. Space, Backspace)
        e.stopPropagation();

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setTempFormula(formula); // Mégse
            setIsEditing(false);
        }
    };

    return (
        <NodeViewWrapper
            className="math-node-wrapper my-3 block select-none"
            contentEditable={false} // Kulcsfontosságú: megvédi a komponenst a ProseMirror szerkesztőjétől!
        >
            {isEditing ? (
                <div
                    className="rounded-md border border-neutral-700 bg-neutral-900 p-3 shadow-md"
                    onMouseDown={(e) => e.stopPropagation()} // Ne engedje a tiptap kurzort elvándorolni
                >
                    <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-400">
                        <span className="font-semibold text-neutral-300">LaTeX formula</span>
                        <span className="text-[11px]">Enter: save | Shift+Enter: new line| Esc: cancel</span>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={tempFormula}
                        onChange={(e) => setTempFormula(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        autoFocus
                        rows={2}
                        placeholder="E = mc^2"
                        className="w-full resize-y rounded bg-neutral-800 p-2 font-mono text-sm text-neutral-100 placeholder-neutral-500 outline-none ring-1 ring-neutral-600 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            ) : (
                <div
                    onClick={() => setIsEditing(true)}
                    className={`group relative flex min-h-[3.5rem] cursor-pointer items-center justify-center rounded-md border p-3 transition-colors ${selected
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                        : 'border-transparent bg-neutral-100 hover:border-neutral-300 hover:bg-neutral-200/60 dark:bg-neutral-900/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-900'
                        }`}
                >
                    <div
                        ref={previewRef}
                        className="overflow-x-auto text-neutral-900 dark:text-neutral-100"
                    />
                    <span className="absolute bottom-1 right-2 text-[10px] text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100">
                        Edit
                    </span>
                </div>
            )}
        </NodeViewWrapper>
    );
};