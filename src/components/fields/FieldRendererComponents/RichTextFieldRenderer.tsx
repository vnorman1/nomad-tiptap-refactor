import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import {
    Upload, FileText, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
    Image as ImageIcon,
    Undo, Redo, Highlighter, Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Code, SquareCode, Minus, Eraser, Youtube as YoutubeIcon, MoreHorizontal, MapPin, Film, Music,
    Table as TableIcon, X, Sigma, Pi, Maximize2, ArrowLeft, Check, Download, Columns2, Maximize,
    Users
} from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import type { BaseFieldProps } from './types';
import { Label, getCentralAlt } from './types';
import { sanitizeHTML, sanitizeMarkdownInput, escapeAttribute } from '@/utils/sanitize';
import MediaPicker, { type MediaItem } from '@/components/Media/MediaPicker';
import { uploadImage, uploadVideo, uploadAudio } from '@/api/upload';
import { useLanguage } from '@/context/LanguageContext';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Youtube from '@tiptap/extension-youtube';
import '@tiptap/extension-image';
import {
    CustomImage, Video, Audio, Coordinates,
    CustomTable, CustomTableRow, CustomTableHeader, CustomTableCell,
    MathFormula, CustomCodeBlock, InlineMath
} from './RichTextExtensions';
import { I18N_CONFIG } from '@/config/admin.config';
import { useEntityPresence } from '@/hooks/useEntityPresence';
import { PresenceBanner } from '@/components/PresenceBanner';

export function normalizeMathInHtml(input: string): string {
    if (!input) return '';
    let result = input;
    // 1. Block math $$...$$ or \[...\]
    result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_m, latex) => {
        return `<div data-type="math-formula" data-latex="${escapeAttribute(latex.trim())}" data-display="true"></div>`;
    });
    result = result.replace(/\\\[([\s\S]+?)\\\]/g, (_m, latex) => {
        return `<div data-type="math-formula" data-latex="${escapeAttribute(latex.trim())}" data-display="true"></div>`;
    });
    // 2. Explicit inline math \(...\)
    result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_m, latex) => {
        return `<span data-type="inline-math" data-latex="${escapeAttribute(latex.trim())}"></span>`;
    });
    // 3. Inline math $...$ (ignoring purely numeric currency like $100 or $5.99)
    result = result.replace(/(^|[^\\$])\$((?!\s)[^$\n]+?(?<!\s))\$(?!\$)/g, (match, prefix, latex) => {
        const trimmed = latex.trim();
        if (/^\d+(?:[.,]\d+)?$/.test(trimmed)) {
            return match;
        }
        return `${prefix}<span data-type="inline-math" data-latex="${escapeAttribute(trimmed)}"></span>`;
    });
    // 4. Normalize legacy span math-formula with data-display="false" to inline-math
    result = result.replace(/<span([^>]*data-type="math-formula"[^>]*data-display="false"[^>]*)>(.*?)<\/span>/gi, (_match, attrs) => {
        const latexMatch = attrs.match(/data-latex="([^"]*)"/i);
        const latex = latexMatch ? latexMatch[1] : '';
        return `<span data-type="inline-math" data-latex="${latex}"></span>`;
    });
    return result;
}

export default function RichTextFieldRenderer({
    field,
    onChange,
    isDisabled,
    isReadOnly,
    safeValue,
    currentLanguage,
    slotKey: propsSlotKey,
    itemId: propsItemId,
}: BaseFieldProps) {
    const {
        t
    } = useTranslation(["editor", "common"]);

    const { showToast } = useUI();
    const { activeLanguage, defaultLanguage } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerAllowedTypes, setMediaPickerAllowedTypes] = useState<('image' | 'video' | 'audio')[]>(['image']);
    const [mediaPickerTitle, setMediaPickerTitle] = useState(t('editor:moreEdits.kep-kivalasztasa', 'Kép kiválasztása'));
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [tableWithHeader, setTableWithHeader] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const menuDropdownRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<React.CSSProperties | null>(null);

    const { theme } = useTheme();
    const [isMaximized, setIsMaximized] = useState(false);
    const [pageWidth, setPageWidth] = useState<'standard' | 'wide' | 'full'>('standard');
    const deskScrollRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);

    // Entity presence tracking for concurrent editing
    const params = useParams<{ slotKey?: string; id?: string; itemId?: string; '*'?: string }>();
    const effectiveSlotKey = propsSlotKey || params.slotKey || '';
    const wildcard = params['*'] || '';
    const wildcardSegments = wildcard.split('/').filter(Boolean);
    const effectiveItemId = propsItemId !== undefined && propsItemId !== null
        ? String(propsItemId)
        : (params.itemId || params.id || (wildcardSegments[0] && !wildcardSegments[0].startsWith('block') ? wildcardSegments[0] : null));

    const { otherEditors, isConcurrent } = useEntityPresence({
        slotKey: effectiveSlotKey,
        itemId: effectiveItemId,
        enabled: Boolean(effectiveSlotKey),
        cleanupOnUnmount: false,
    });

    const [, setEditorUpdateTrigger] = useState(0);

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                codeBlock: false,
                link: false,
                underline: false,
            }),
            CustomCodeBlock,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline decoration-dotted underline-offset-2 hover:text-blue-400 hover:decoration-solid transition-colors',
                },
            }),
            CustomImage,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            Highlight.configure({
                HTMLAttributes: {
                    class: 'bg-yellow-300/30 text-yellow-900 dark:text-yellow-100 px-1 rounded',
                },
            }),
            Subscript,
            Superscript,
            Youtube.configure({
                inline: false,
                HTMLAttributes: {
                    class: 'w-full aspect-video rounded shadow-sm border border-border/50 my-4'
                }
            }),
            Video,
            Audio,
            Coordinates,
            CustomTable,
            CustomTableRow,
            CustomTableHeader,
            CustomTableCell,
            MathFormula,
            InlineMath,
        ],
        content: normalizeMathInHtml(safeValue || ''),
        editable: !isDisabled && !isReadOnly,
        onSelectionUpdate: () => {
            setEditorUpdateTrigger(c => (c + 1) % 1000000);
        },
        onTransaction: () => {
            setEditorUpdateTrigger(c => (c + 1) % 1000000);
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            handlePaste: (_view, event) => {
                const text = event.clipboardData?.getData('text/plain');
                if (!text) return false;

                // 1. Markdown tables
                if (/\|[^\n]+\|\r?\n\|[-:\s|]+\|/.test(text)) {
                    const html = event.clipboardData?.getData('text/html');
                    if (!html || !html.includes('<table')) {
                        event.preventDefault();
                        let normalized = text.replace(/([^\n])\r?\n(\|[^\n]+\|\r?\n\|[-:\s|]+\|)/g, '$1\n\n$2');
                        normalized = normalizeMathInHtml(normalized);
                        const sanitized = sanitizeMarkdownInput(normalized);
                        Promise.resolve(marked.parse(sanitized, { gfm: true })).then((parsedHtml) => {
                            const safe = sanitizeHTML(parsedHtml);
                            if (editor && !editor.isDestroyed) {
                                editor.commands.insertContent(safe);
                            }
                        });
                        return true;
                    }
                }

                // 2. Math formulas ($...$ or $$...$$) and lists containing math
                const hasMath = /\$\$[\s\S]+?\$\$|(?:^|[^\\])\$[^$\n]+?\$/.test(text);
                if (hasMath) {
                    event.preventDefault();
                    let processed = normalizeMathInHtml(text);

                    const hasMarkdown = /(?:^|\n)\s*(?:[*+-]|\d+\.|#{1,6})\s+/.test(text) || text.includes('**') || text.includes('`');
                    if (hasMarkdown) {
                        const sanitized = sanitizeMarkdownInput(processed);
                        Promise.resolve(marked.parse(sanitized, { gfm: true })).then((parsedHtml) => {
                            const safe = sanitizeHTML(parsedHtml);
                            if (editor && !editor.isDestroyed) {
                                editor.commands.insertContent(safe);
                            }
                        });
                    } else {
                        const safe = sanitizeHTML(processed);
                        if (editor && !editor.isDestroyed) {
                            editor.commands.insertContent(safe);
                        }
                    }
                    return true;
                }
                return false;
            },
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 text-foreground leading-relaxed ' +
                    '[&_h1]:text-lg [&_h1]:font-bold [&_h1]: [&_h1]:uppercase [&_h1]:tracking-wider [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:border-b [&_h1]:border-foreground/30 [&_h1]:pb-3 ' +
                    '[&_h2]:text-base [&_h2]:font-bold [&_h2]: [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-foreground/20 [&_h2]:pb-2 ' +
                    '[&_h3]:text-sm [&_h3]:font-bold [&_h3]: [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:mt-4 [&_h3]:mb-2 ' +
                    '[&_p]:text-xs [&_p]:my-3 [&_p]:leading-relaxed [&_p]:opacity-90 ' +
                    '[&_ul]:my-3 [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:my-3 [&_ol]:ml-4 [&_ol]:list-decimal [&_li]:text-xs ' +
                    '[&_blockquote]:border-l-4 [&_blockquote]:border-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:opacity-75 [&_blockquote]:text-xs ' +
                    '[&_pre:not(.nomad-code-block_pre)]:bg-foreground/5 [&_pre:not(.nomad-code-block_pre)]:p-3 [&_pre:not(.nomad-code-block_pre)]:rounded [&_pre:not(.nomad-code-block_pre)]:my-3 [&_pre:not(.nomad-code-block_pre)]:text-[11px] ' +
                    '[&_code]:text-[11px] [&_code]:bg-foreground/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]: ' +
                    '[&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:text-xs [&_table]:border [&_table]:border-border ' +
                    '[&_th]:bg-secondary/20 [&_th]:border [&_th]:border-border [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground ' +
                    '[&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1 [&_td]:text-foreground [&_td]:align-top ' +
                    '[&_tr:hover]:bg-secondary/10 ' +
                    '[&_.selectedCell]:bg-primary/20 [&_.column-resize-handle]:bg-primary ' +
                    '[&_hr]:my-6 [&_hr]:border-foreground/20'
            },
        },
    });

    // Update editor content if safeValue changes externally
    useEffect(() => {
        if (editor) {
            const currentHtml = editor.getHTML();
            const normalized = normalizeMathInHtml(safeValue || '');
            if (normalized !== currentHtml && safeValue !== currentHtml) {
                editor.commands.setContent(normalized);
            }
        }
    }, [safeValue, editor]);

    // Handle opening and positioning the more menu portal
    const handleToggleMoreMenu = () => {
        if (showMoreMenu) {
            setShowMoreMenu(false);
            return;
        }
        if (moreButtonRef.current) {
            const rect = moreButtonRef.current.getBoundingClientRect();
            const MENU_WIDTH = 264;
            const MENU_HEIGHT = 380;
            const GAP = 6;
            const VIEWPORT_MARGIN = 10;

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const openUpward = spaceBelow < 300 && spaceAbove > spaceBelow;

            const style: React.CSSProperties = {
                position: 'fixed',
                zIndex: 999999,
                width: `${MENU_WIDTH}px`,
            };

            if (openUpward) {
                style.bottom = `${window.innerHeight - rect.top + GAP}px`;
                style.maxHeight = `${Math.min(MENU_HEIGHT, spaceAbove - GAP - VIEWPORT_MARGIN)}px`;
            } else {
                style.top = `${rect.bottom + GAP}px`;
                style.maxHeight = `${Math.min(MENU_HEIGHT, spaceBelow - GAP - VIEWPORT_MARGIN)}px`;
            }

            let left = rect.right - MENU_WIDTH;
            left = Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN);
            left = Math.max(left, VIEWPORT_MARGIN);
            style.left = `${left}px`;

            setMenuPosition(style);
            setShowMoreMenu(true);
        }
    };

    // Close more menu on outside click, escape, scroll or resize
    useEffect(() => {
        if (!showMoreMenu) return;
        function handleOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                menuDropdownRef.current && !menuDropdownRef.current.contains(target) &&
                moreButtonRef.current && !moreButtonRef.current.contains(target)
            ) {
                setShowMoreMenu(false);
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setShowMoreMenu(false);
            }
        }
        function handleScroll() {
            setShowMoreMenu(false);
        }
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        window.addEventListener('resize', handleScroll);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleScroll);
        };
    }, [showMoreMenu]);

    // Document text metrics for Google Docs mode
    const documentText = editor?.getText() || '';
    const wordCount = useMemo(() => {
        return documentText.trim() ? documentText.trim().split(/\s+/).length : 0;
    }, [documentText]);
    const charCount = documentText.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // Handle Escape and Shift+Cmd+F for Maximized Google Docs mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const meta = e.metaKey || e.ctrlKey;

            // Shift + Cmd/Ctrl + F: toggle maximized mode
            if (meta && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                setIsMaximized(m => !m);
                return;
            }

            // Escape key exits maximized mode
            if (e.key === 'Escape' && isMaximized) {
                // If sub-modals like table or media picker are open, let them close first
                if (showTableModal || showMediaPicker) return;
                // If user is editing a Math formula, let MathFormulaNode handle Escape
                const isEditingMath = Boolean(document.activeElement?.closest('.group\\/math') || document.querySelector('.group\\/math textarea'));
                if (isEditingMath) return;

                e.preventDefault();
                e.stopPropagation();
                setIsMaximized(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isMaximized, showTableModal, showMediaPicker]);

    const handleExportDocument = () => {
        const html = editor?.getHTML() || '';
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = (field.label || 'dokumentum').toLowerCase().replace(/[^a-z0-9]/gi, '-');
        a.download = `${cleanName}-${new Date().toISOString().slice(0, 10)}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const processFile = async (file: File) => {
        const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown');

        if (!isMarkdown) {
            showToast('error', t('richTextFieldRenderer.toast.invalidFileTitle', 'ÉRVÉNYTELEN FÁJL'), t('richTextFieldRenderer.toast.invalidFileMessage', 'Csak .md vagy .markdown fájlok importálhatók.'));
            return;
        }

        try {
            const text = await file.text();
            let normalized = text.replace(/([^\n])\r?\n(\|[^\n]+\|\r?\n\|[-:\s|]+\|)/g, '$1\n\n$2');
            // Convert $$...$$ display math blocks into <div data-type="math-formula">...</div>
            normalized = normalized.replace(/\$\$([\s\S]+?)\$\$/g, (_m, latex) => `\n\n<div data-type="math-formula" data-latex="${escapeAttribute(latex.trim())}" data-display="true"></div>\n\n`);
            // Convert $...$ inline math into <span data-type="inline-math">...</span>
            normalized = normalized.replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_m, prefix, latex) => `${prefix}<span data-type="inline-math" data-latex="${escapeAttribute(latex.trim())}"></span>`);
            const sanitizedMarkdown = sanitizeMarkdownInput(normalized);
            const htmlContent = await marked.parse(sanitizedMarkdown, { gfm: true });
            const safeHtml = sanitizeHTML(htmlContent);

            if (editor) {
                editor.commands.setContent(safeHtml);
                onChange(editor.getHTML());
            }

            showToast('success', t('richTextFieldRenderer.toast.importSuccessTitle', 'IMPORTÁLÁS SIKERES'), t('richTextFieldRenderer.toast.importSuccessMessage', 'Markdown tartalom konvertálva és betöltve.'));
        } catch (error) {
            console.error(error);
            showToast('error', t('richTextFieldRenderer.toast.readErrorTitle', 'OLVASÁSI HIBA'), t('richTextFieldRenderer.toast.readErrorMessage', 'Nem sikerült beolvasni a fájlt.'));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isDisabled && !isReadOnly) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (isDisabled || isReadOnly) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        if (files[0].name.endsWith('.md') || files[0].name.endsWith('.markdown')) {
            await processFile(files[0]);
        } else {
            showToast('warning', t('richTextFieldRenderer.toast.insertImagesTitle', 'KÉPEK BEILLESZTÉSE'), t('richTextFieldRenderer.toast.insertImagesMessage', 'Kérlek használd a Kép gombot a médiatár megnyitásához.'));
        }
    };

    const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isDisabled || isReadOnly) return;
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const setYoutube = () => {
        if (!editor) return;
        const url = window.prompt(t('editor:moreEdits.youtube-video-url', 'YouTube videó URL:'));
        if (url === null || url === '') return;
        editor.commands.setYoutubeVideo({
            src: url,
            width: 640,
            height: 480,
        });
        setShowMoreMenu(false);
    };

    const openMediaPicker = (type: 'image' | 'video' | 'audio') => {
        if (type === 'video') {
            setMediaPickerAllowedTypes(['video']);
            setMediaPickerTitle(t('editor:moreEdits.video-kivalasztasa-a-konyvtarb', 'Videó kiválasztása a könyvtárból'));
        } else if (type === 'audio') {
            setMediaPickerAllowedTypes(['audio']);
            setMediaPickerTitle(t('editor:moreEdits.hanganyag-kivalasztasa-a-konyv', 'Hanganyag kiválasztása a könyvtárból'));
        } else {
            setMediaPickerAllowedTypes(['image']);
            setMediaPickerTitle(t('editor:moreEdits.kep-kivalasztasa-a-konyvtarbol', 'Kép kiválasztása a könyvtárból'));
        }
        setShowMediaPicker(true);
    };

    const handleMediaSelect = (url: string, item?: MediaItem) => {
        if (!editor) return;
        const ext = url.split('.').pop()?.toLowerCase();

        // Resolve ALT text for current active language or central fallback
        const central = getCentralAlt(url);
        const altDict: Record<string, string> = (item && item.alt) ? item.alt : central;
        const defLang = defaultLanguage || I18N_CONFIG.defaultLanguage || 'hu';
        const activeLang = currentLanguage || activeLanguage || defLang;
        const chosenAlt = (altDict && (altDict[activeLang] || altDict[defLang] || Object.values(altDict)[0])) || '';

        if (ext && ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) {
            editor.chain().focus().setVideo({ src: url, alt: chosenAlt }).run();
        } else if (ext && ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
            editor.chain().focus().setAudio({ src: url, alt: chosenAlt }).run();
        } else {
            editor.chain().focus().setImage({
                src: url,
                alt: chosenAlt
            }).run();
        }
        setShowMediaPicker(false);
    };

    const setCoordinates = () => {
        if (!editor) return;
        const lat = window.prompt(t('editor:moreEdits.szelessegi-fok-latitude', 'Szélességi fok (Latitude):'), '47.4979');
        if (lat === null || lat === '') return;
        const lng = window.prompt(t('editor:moreEdits.hosszusagi-fok-longitude', 'Hosszúsági fok (Longitude):'), '19.0402');
        if (lng === null || lng === '') return;

        editor.commands.setCoordinates({ lat, lng });
        setShowMoreMenu(false);
    };

    const handleMediaUpload = async (file: File): Promise<string> => {
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');

        let response;
        if (isVideo) {
            response = await uploadVideo(file);
        } else if (isAudio) {
            response = await uploadAudio(file);
        } else {
            response = await uploadImage(file);
        }
        if (!response.url) {
            throw new Error('Upload failed: no URL returned');
        }

        return response.url;
    };

    const handleInsertTable = () => {
        if (!editor) return;
        editor.chain().focus().insertTable({
            rows: Math.max(1, tableRows),
            cols: Math.max(1, tableCols),
            withHeaderRow: tableWithHeader,
        }).run();
        setShowTableModal(false);
        setShowMoreMenu(false);
    };

    return (
        <div className="space-y-2 group">
            <Label required={field.required}>{field.label}</Label>

            <div
                className={`relative border transition-all duration-300 flex flex-col
                    ${isDragging ? 'border-2 border-foreground bg-secondary/20 scale-[1.01] z-10' : 'border-border'}
                    ${(isDisabled || isReadOnly) ? 'opacity-60 pointer-events-none bg-secondary/5' : 'bg-background'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm pointer-events-none">
                        <FileText size={48} className="mb-4 animate-bounce text-foreground" />
                        <h3 className="text-lg font-bold tracking-tight">{t("richTextFieldRenderer.ejtse-ide-a-fajlt")}</h3>
                        <p className="text-xs  uppercase tracking-widest opacity-60">{t("richTextFieldRenderer.markdown-importalasa")}</p>
                    </div>
                )}

                {/* Toolbar */}
                {editor && !isDisabled && !isReadOnly && (
                    <div className="flex items-center justify-between p-1.5 border-b border-border bg-secondary/10 relative gap-1">
                        {/* Primary Essentials (Flex-1, wraps naturally if needed) */}
                        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0 pr-1">
                            <ToolbarButton isActive={false} onClick={() => editor.chain().focus().undo().run()} icon={<Undo size={14} />} title={t("richTextFieldRenderer.visszavonas")} />
                            <ToolbarButton isActive={false} onClick={() => editor.chain().focus().redo().run()} icon={<Redo size={14} />} title={t("richTextFieldRenderer.ujra")} />

                            <div className="w-px h-4 bg-border/60 mx-0.5" />

                            <ToolbarButton isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={14} />} title={t("richTextFieldRenderer.felkover")} />
                            <ToolbarButton isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={14} />} title={t("richTextFieldRenderer.dolt")} />
                            <ToolbarButton isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon size={14} />} title={t("richTextFieldRenderer.alahuzott")} />

                            <div className="w-px h-4 bg-border/60 mx-0.5" />

                            <ToolbarButton isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={14} />} title={t("richTextFieldRenderer.cimsor-1")} />
                            <ToolbarButton isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={14} />} title={t("richTextFieldRenderer.cimsor-2")} />
                            <ToolbarButton isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 size={14} />} title={t("richTextFieldRenderer.cimsor-3")} />

                            <div className="w-px h-4 bg-border/60 mx-0.5" />

                            <ToolbarButton isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={14} />} title={t("richTextFieldRenderer.felsorolas")} />
                            <ToolbarButton isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered size={14} />} title={t("richTextFieldRenderer.szamozott-lista")} />

                            <div className="w-px h-4 bg-border/60 mx-0.5" />

                            <ToolbarButton isActive={editor.isActive('link')} onClick={setLink} icon={<LinkIcon size={14} />} title={t("richTextFieldRenderer.link-beszurasa")} />
                            <ToolbarButton isActive={false} onClick={() => openMediaPicker('image')} icon={<ImageIcon size={14} />} title={t("richTextFieldRenderer.kep-beszurasa-mediatar")} />
                            <ToolbarButton isActive={editor.isActive('table')} onClick={() => setShowTableModal(true)} icon={<TableIcon size={14} />} title={t("richTextFieldRenderer.tablazat-beszurasa", "Táblázat beszúrása")} />
                        </div>

                        {/* Right: Pinned Docs Mode Toggle & More Menu Trigger */}
                        <div className="flex items-center gap-1 shrink-0 self-start pl-1 border-l border-border/60">
                            <ToolbarButton
                                isActive={false}
                                onClick={() => setIsMaximized(true)}
                                icon={<Maximize2 size={14} />}
                                title={t("richTextFieldRenderer.openDocsMode", "Dokumentum nézet / Kinagyítás (Google Docs mód) (⇧⌘F)")}
                            />

                            <button
                                ref={moreButtonRef}
                                type="button"
                                onClick={handleToggleMoreMenu}
                                className={cn(
                                    "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center",
                                    showMoreMenu
                                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                        : "border-border/60 bg-background/50 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                                )}
                                title={t("richTextFieldRenderer.tovabbi-eszkozok", "További eszközök...")}
                            >
                                <MoreHorizontal size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* More Menu Dropdown Rendered via Portal */}
                {showMoreMenu && menuPosition && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={menuDropdownRef}
                        style={menuPosition}
                        onClick={(e) => e.stopPropagation()}
                        className="fixed z-[999999] bg-popover text-popover-foreground border border-border shadow-2xl rounded-2xl p-3 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 font-sans"
                    >
                        {/* Blocks, Media & Math */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1 font-semibold">
                                {t("richTextFieldRenderer.blokkok-and-media", "Blokkok & Objektumok")}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                <ToolbarButton
                                    variant="menu"
                                    isActive={editor?.isActive('mathFormula') ?? false}
                                    onClick={() => {
                                        editor?.chain().focus().setMathFormula({ latex: '' }).run();
                                        setShowMoreMenu(false);
                                    }}
                                    icon={<Sigma size={14} />}
                                    title={t("richTextFieldRenderer.matematikai-keplet", "Matematikai képlet (LaTeX)")}
                                />
                                <ToolbarButton
                                    variant="menu"
                                    isActive={editor?.isActive('inlineMath') ?? false}
                                    onClick={() => {
                                        if (editor) {
                                            const { from, to } = editor.state.selection;
                                            const sel = editor.state.doc.textBetween(from, to, ' ');
                                            editor.chain().focus().insertInlineMath({ latex: sel }).run();
                                        }
                                        setShowMoreMenu(false);
                                    }}
                                    icon={<Pi size={14} />}
                                    title={t("richTextFieldRenderer.matek-karakter", "Matek karakter / szimbólum ($x$)")}
                                />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('codeBlock') ?? false} onClick={() => { editor?.chain().focus().toggleCodeBlock().run(); setShowMoreMenu(false); }} icon={<SquareCode size={14} />} title={t("richTextFieldRenderer.kod-blokk")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('code') ?? false} onClick={() => { editor?.chain().focus().toggleCode().run(); setShowMoreMenu(false); }} icon={<Code size={14} />} title={t("richTextFieldRenderer.kod-inline")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('blockquote') ?? false} onClick={() => { editor?.chain().focus().toggleBlockquote().run(); setShowMoreMenu(false); }} icon={<Quote size={14} />} title={t("richTextFieldRenderer.idezet")} />
                                <ToolbarButton variant="menu" isActive={false} onClick={() => { editor?.chain().focus().setHorizontalRule().run(); setShowMoreMenu(false); }} icon={<Minus size={14} />} title={t("richTextFieldRenderer.valasztovonal")} />
                                <ToolbarButton variant="menu" isActive={false} onClick={() => { openMediaPicker('video'); setShowMoreMenu(false); }} icon={<Film size={14} />} title={t("richTextFieldRenderer.video-beszurasa-mediatar")} />
                                <ToolbarButton variant="menu" isActive={false} onClick={() => { openMediaPicker('audio'); setShowMoreMenu(false); }} icon={<Music size={14} />} title={t("richTextFieldRenderer.audio-beszurasa-mediatar")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('youtube') ?? false} onClick={() => { setYoutube(); setShowMoreMenu(false); }} icon={<YoutubeIcon size={14} />} title={t("richTextFieldRenderer.youtube-video")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('coordinates') ?? false} onClick={() => { setCoordinates(); setShowMoreMenu(false); }} icon={<MapPin size={14} />} title={t("richTextFieldRenderer.terkep-koordinatak-beszurasa")} />
                            </div>
                        </div>

                        {/* Additional Formatting */}
                        <div className="space-y-1.5 pt-2 border-t border-border">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1 font-semibold">
                                {t("richTextFieldRenderer.tovabbi-formazasok", "Formázások")}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                <ToolbarButton variant="menu" isActive={editor?.isActive('strike') ?? false} onClick={() => editor?.chain().focus().toggleStrike().run()} icon={<Strikethrough size={14} />} title={t("richTextFieldRenderer.athuzott")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('highlight') ?? false} onClick={() => editor?.chain().focus().toggleHighlight().run()} icon={<Highlighter size={14} />} title={t("richTextFieldRenderer.kiemeles")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('subscript') ?? false} onClick={() => editor?.chain().focus().toggleSubscript().run()} icon={<SubscriptIcon size={14} />} title={t("richTextFieldRenderer.also-index")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive('superscript') ?? false} onClick={() => editor?.chain().focus().toggleSuperscript().run()} icon={<SuperscriptIcon size={14} />} title={t("richTextFieldRenderer.felso-index")} />
                                <ToolbarButton variant="menu" isActive={false} onClick={() => editor?.chain().focus().unsetAllMarks().run()} icon={<Eraser size={14} />} title={t("richTextFieldRenderer.formazas-torlese")} />
                            </div>
                        </div>

                        {/* Alignment */}
                        <div className="space-y-1.5 pt-2 border-t border-border">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1 font-semibold">
                                {t("richTextFieldRenderer.igazitas", "Igazítás")}
                            </span>
                            <div className="flex flex-wrap gap-1">
                                <ToolbarButton variant="menu" isActive={editor?.isActive({ textAlign: 'left' }) ?? false} onClick={() => editor?.chain().focus().setTextAlign('left').run()} icon={<AlignLeft size={14} />} title={t("richTextFieldRenderer.balra-igazitas")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive({ textAlign: 'center' }) ?? false} onClick={() => editor?.chain().focus().setTextAlign('center').run()} icon={<AlignCenter size={14} />} title={t("richTextFieldRenderer.kozepre-igazitas")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive({ textAlign: 'right' }) ?? false} onClick={() => editor?.chain().focus().setTextAlign('right').run()} icon={<AlignRight size={14} />} title={t("richTextFieldRenderer.jobbra-igazitas")} />
                                <ToolbarButton variant="menu" isActive={editor?.isActive({ textAlign: 'justify' }) ?? false} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} icon={<AlignJustify size={14} />} title={t("richTextFieldRenderer.sorkizart")} />
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Table Context Controls (active when cursor is inside a table) */}
                {editor && !isDisabled && !isReadOnly && editor.isActive('table') && (
                    <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/40 text-[10px] text-muted-foreground animate-in fade-in">
                        <span className="font-mono font-semibold uppercase tracking-wider text-[9px] text-foreground/80 flex items-center gap-1 mr-1">
                            <TableIcon size={11} /> {t('richTextFieldRenderer.tablazat', 'Táblázat')}:
                        </span>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addRowBefore().run()}
                            className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
                            title={t('richTextFieldRenderer.sor-fele', 'Sor beszúrása elé')}
                        >
                            + {t('richTextFieldRenderer.sor-fele-btn', 'Sor felé')}
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                            className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
                            title={t('richTextFieldRenderer.sor-ala', 'Sor beszúrása alá')}
                        >
                            + {t('richTextFieldRenderer.sor-ala-btn', 'Sor alá')}
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteRow().run()}
                            className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title={t('richTextFieldRenderer.sor-torlese', 'Sor törlése')}
                        >
                            - {t('richTextFieldRenderer.sor-torlese-btn', 'Sor')}
                        </button>
                        <div className="w-px h-3 bg-border/60 mx-0.5" />
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addColumnBefore().run()}
                            className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
                            title={t('richTextFieldRenderer.oszlop-balra', 'Oszlop beszúrása balra')}
                        >
                            + {t('richTextFieldRenderer.oszlop-balra-btn', 'Oszlop balra')}
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                            className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
                            title={t('richTextFieldRenderer.oszlop-jobbra', 'Oszlop beszúrása jobbra')}
                        >
                            + {t('richTextFieldRenderer.oszlop-jobbra-btn', 'Oszlop jobbra')}
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteColumn().run()}
                            className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title={t('richTextFieldRenderer.oszlop-torlese', 'Oszlop törlése')}
                        >
                            - {t('richTextFieldRenderer.oszlop-torlese-btn', 'Oszlop')}
                        </button>
                        <div className="w-px h-3 bg-border/60 mx-0.5" />
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                            className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
                            title={t('richTextFieldRenderer.fejlec-valtasa', 'Fejlécsor ki/be')}
                        >
                            {t('richTextFieldRenderer.fejlec-btn', 'Fejléc')}
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            className="ml-auto px-1.5 py-0.5 rounded border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            title={t('richTextFieldRenderer.tablazat-torlese', 'Teljes táblázat törlése')}
                        >
                            {t('richTextFieldRenderer.tablazat-torlese-btn', 'Táblázat törlése')}
                        </button>
                    </div>
                )}

                {/* Editor Content or Maximized Placeholder */}
                {isMaximized ? (
                    <div className="p-8 text-center text-xs font-mono text-muted-foreground flex flex-col items-center justify-center gap-3 bg-muted/15 border border-dashed border-border rounded min-h-[220px]">
                        <div className="p-3 rounded-full bg-primary/10 text-primary animate-pulse">
                            <Maximize2 size={24} />
                        </div>
                        <div className="font-semibold text-foreground text-xs">
                            {t("richTextFieldRenderer.inDocumentMode", "A szerkesztő jelenleg teljes képernyős Docs nézetben van nyitva")}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMaximized(false)}
                            className="px-3.5 py-1.5 bg-foreground text-background text-xs font-bold uppercase tracking-wider rounded hover:bg-foreground/90 transition-colors cursor-pointer"
                        >
                            {t("richTextFieldRenderer.returnToInline", "Visszatérés a kártyához")}
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 max-h-[600px] overflow-y-auto custom-scrollbar relative">
                        {(!editor || (editor.isEmpty && !editor.isFocused)) && (
                            <div className="absolute top-4 left-4 pointer-events-none text-[10px] uppercase tracking-widest opacity-30">
                                // {field.label.toUpperCase()} {t("richTextFieldRenderer.tartalom")}
                            </div>
                        )}
                        <EditorContent editor={editor} />
                    </div>
                )}

                {!isDisabled && !isReadOnly && (
                    <>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".md,.markdown"
                            className="hidden"
                            onChange={handleManualUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title={t("richTextFieldRenderer.import-markdown-md")}
                            type="button"
                            className="absolute bottom-3 right-3 p-2 bg-secondary/10 hover:bg-foreground hover:text-background border border-transparent hover:border-foreground rounded-full transition-all duration-300 z-10 opacity-40 hover:opacity-100 group-hover:opacity-60"
                        >
                            <Upload size={14} />
                        </button>
                    </>
                )}
            </div>

            <div className="flex justify-between items-center text-[9px] opacity-40">
                <span>{t("richTextFieldRenderer.drag-and-drop-md-supported")}</span>
            </div>

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleMediaSelect}
                onUpload={handleMediaUpload}
                allowedTypes={mediaPickerAllowedTypes}
                title={mediaPickerTitle}
            />

            {/* Custom Table Insert Modal Rendered via Portal */}
            {showTableModal && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-none"
                    onClick={() => setShowTableModal(false)}
                >
                    <div
                        className="bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl p-5 max-w-xs w-full space-y-4 animate-in zoom-in-95 font-sans"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                <TableIcon size={14} className="text-primary" />
                                {t('richTextFieldRenderer.tablazat-beszurasa', 'Táblázat beszúrása')}
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowTableModal(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <label className="space-y-1">
                                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">{t('richTextFieldRenderer.sorok-szama', 'Sorok száma')}</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={tableRows}
                                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none transition-all shadow-2xs"
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">{t('richTextFieldRenderer.oszlopok-szama', 'Oszlopok száma')}</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={15}
                                    value={tableCols}
                                    onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none transition-all shadow-2xs"
                                />
                            </label>
                        </div>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                                type="checkbox"
                                checked={tableWithHeader}
                                onChange={(e) => setTableWithHeader(e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-muted-foreground select-none">
                                {t('richTextFieldRenderer.fejlec-sor-tartalmazasa', 'Fejléc sor (Header row)')}
                            </span>
                        </label>
                        <div className="flex gap-2 pt-1 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setShowTableModal(false)}
                                className="flex-1 py-1.5 px-3 bg-secondary hover:bg-secondary/80 text-foreground font-medium text-xs rounded-lg transition-colors cursor-pointer"
                            >
                                {t('richTextFieldRenderer.megse', 'Mégse')}
                            </button>
                            <button
                                type="button"
                                onClick={handleInsertTable}
                                className="flex-1 py-1.5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                            >
                                {t('richTextFieldRenderer.beszuras', 'Beszúrás')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* FULL SCREEN GOOGLE DOCS WORKSPACE OVERLAY */}
            {isMaximized && typeof document !== 'undefined' && createPortal(
                <div
                    className={cn(
                        "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-background text-foreground animate-in fade-in duration-200 select-text",
                        theme === 'dark' && "dark"
                    )}
                >
                    {/* TOP NAVIGATION BAR */}
                    <div className="h-13 border-b border-border/50 bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none">
                        {/* Left: Return, Title, Saved Status */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => setIsMaximized(false)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 -ml-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors cursor-pointer"
                                title={t("richTextFieldRenderer.visszateres", "Visszatérés") + " (Esc)"}
                            >
                                <ArrowLeft size={15} />
                                <span className="font-medium">{t("richTextFieldRenderer.visszateres", "Visszatérés")}</span>
                            </button>

                            <div className="w-px h-4 bg-border/50 mx-0.5" />

                            <span className="text-xs font-semibold text-foreground truncate max-w-[150px] sm:max-w-xs">
                                {field.label}
                            </span>

                            {/* Concurrent editors badge in top bar */}
                            {isConcurrent && otherEditors.length > 0 && (
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-medium text-amber-700 dark:text-amber-300"
                                    title={t("presenceBanner.aktiv-szerkesztok", {
                                        var1: otherEditors.join(', ')
                                    })}
                                >
                                    <Users size={12} className="animate-pulse" />
                                    <span>{otherEditors.length + 1} {t("presenceBanner.aktiv", "aktív")}</span>
                                </div>
                            )}
                        </div>

                        {/* Right: Width switcher, Tools, Done */}
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            {/* Page Width Selector */}
                            <div className="flex items-center bg-secondary/40 p-0.5 rounded-lg border border-border/40 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setPageWidth('standard')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                                        pageWidth === 'standard' ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title={t("richTextFieldRenderer.standardWidth", "A4 (850px)")}
                                >
                                    <FileText size={12} />
                                    <span>A4</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPageWidth('wide')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                                        pageWidth === 'wide' ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title={t("richTextFieldRenderer.wideWidth", "Széles (1150px)")}
                                >
                                    <Columns2 size={12} />
                                    <span className="hidden sm:inline">{t("richTextFieldRenderer.szeles", "Széles")}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPageWidth('full')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                                        pageWidth === 'full' ? "bg-background text-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title={t("richTextFieldRenderer.fullWidth", "Teljes szélesség")}
                                >
                                    <Maximize size={12} />
                                    <span className="hidden sm:inline">{t("richTextFieldRenderer.teljes", "Teljes")}</span>
                                </button>
                            </div>

                            <div className="w-px h-4 bg-border/50 mx-0.5 hidden sm:block" />

                            {/* Import / Export Tools */}
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title={t("richTextFieldRenderer.import-markdown-md", "Import Markdown (.md)")}
                                >
                                    <Upload size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportDocument}
                                    className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    title={t("richTextFieldRenderer.exportDoc", "Dokumentum letöltése (HTML)")}
                                >
                                    <Download size={14} />
                                </button>
                            </div>

                            {/* Done / Close Button */}
                            <button
                                type="button"
                                onClick={() => setIsMaximized(false)}
                                className="ml-1 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <Check size={14} />
                                <span>{t("richTextFieldRenderer.kesz", "Kész")}</span>
                            </button>
                        </div>
                    </div>

                    {/* Soft Collision / Presence Notification Banner */}
                    <PresenceBanner
                        otherEditors={otherEditors}
                        isConcurrent={isConcurrent}
                        className="z-25 border-b shrink-0"
                    />

                    {/* DEDICATED TOP FORMATTING RIBBON */}
                    {editor && !isDisabled && !isReadOnly && (
                        <div className="border-b border-border/50 bg-background/95 backdrop-blur-md px-4 sm:px-6 py-1.5 flex flex-wrap items-center gap-1 shrink-0 z-20 shadow-xs">
                            {/* Undo / Redo */}
                            <ToolbarButton isActive={false} onClick={() => editor.chain().focus().undo().run()} icon={<Undo size={14} />} title={t("richTextFieldRenderer.visszavonas")} />
                            <ToolbarButton isActive={false} onClick={() => editor.chain().focus().redo().run()} icon={<Redo size={14} />} title={t("richTextFieldRenderer.ujra")} />

                            <div className="w-px h-4 bg-border/60 mx-1" />

                            {/* Paragraph / Headings */}
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setParagraph().run()}
                                className={cn(
                                    "px-2 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer",
                                    !editor.isActive('heading') ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                                )}
                                title={t("richTextFieldRenderer.bekezdes", "Bekezdés")}
                            >
                                P
                            </button>
                            <ToolbarButton isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={14} />} title={t("richTextFieldRenderer.cimsor-1")} />
                            <ToolbarButton isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={14} />} title={t("richTextFieldRenderer.cimsor-2")} />
                            <ToolbarButton isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 size={14} />} title={t("richTextFieldRenderer.cimsor-3")} />

                            <div className="w-px h-4 bg-border/60 mx-1" />

                            {/* Inline Styles */}
                            <ToolbarButton isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={14} />} title={t("richTextFieldRenderer.felkover")} />
                            <ToolbarButton isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={14} />} title={t("richTextFieldRenderer.dolt")} />
                            <ToolbarButton isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon size={14} />} title={t("richTextFieldRenderer.alahuzott")} />
                            <ToolbarButton isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} icon={<Strikethrough size={14} />} title={t("richTextFieldRenderer.athuzott")} />
                            <ToolbarButton isActive={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} icon={<Highlighter size={14} />} title={t("richTextFieldRenderer.kiemeles")} />
                            <ToolbarButton isActive={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} icon={<SubscriptIcon size={14} />} title={t("richTextFieldRenderer.also-index")} />
                            <ToolbarButton isActive={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} icon={<SuperscriptIcon size={14} />} title={t("richTextFieldRenderer.felso-index")} />
                            <ToolbarButton isActive={false} onClick={() => editor.chain().focus().unsetAllMarks().run()} icon={<Eraser size={14} />} title={t("richTextFieldRenderer.formazas-torlese")} />

                            <div className="w-px h-4 bg-border/60 mx-1" />

                            {/* Alignments */}
                            <ToolbarButton isActive={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeft size={14} />} title={t("richTextFieldRenderer.balra-igazitas")} />
                            <ToolbarButton isActive={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenter size={14} />} title={t("richTextFieldRenderer.kozepre-igazitas")} />
                            <ToolbarButton isActive={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRight size={14} />} title={t("richTextFieldRenderer.jobbra-igazitas")} />
                            <ToolbarButton isActive={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} icon={<AlignJustify size={14} />} title={t("richTextFieldRenderer.sorkizart")} />

                            <div className="w-px h-4 bg-border/60 mx-1" />

                            {/* Lists & Quotes & Code */}
                            <ToolbarButton isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={14} />} title={t("richTextFieldRenderer.felsorolas")} />
                            <ToolbarButton isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered size={14} />} title={t("richTextFieldRenderer.szamozott-lista")} />
                            <ToolbarButton isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote size={14} />} title={t("richTextFieldRenderer.idezet")} />
                            <ToolbarButton isActive={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} icon={<Code size={14} />} title={t("richTextFieldRenderer.kod-inline")} />
                            <ToolbarButton isActive={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={<SquareCode size={14} />} title={t("richTextFieldRenderer.kod-blokk")} />
                            <ToolbarButton isActive={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus size={14} />} title={t("richTextFieldRenderer.valasztovonal")} />

                            <div className="w-px h-4 bg-border/60 mx-1" />

                            {/* Insert Objects */}
                            <ToolbarButton isActive={editor.isActive('link')} onClick={setLink} icon={<LinkIcon size={14} />} title={t("richTextFieldRenderer.link-beszurasa")} />
                            <ToolbarButton isActive={false} onClick={() => openMediaPicker('image')} icon={<ImageIcon size={14} />} title={t("richTextFieldRenderer.kep-beszurasa-mediatar")} />
                            <ToolbarButton isActive={false} onClick={() => openMediaPicker('video')} icon={<Film size={14} />} title={t("richTextFieldRenderer.video-beszurasa-mediatar")} />
                            <ToolbarButton isActive={false} onClick={() => openMediaPicker('audio')} icon={<Music size={14} />} title={t("richTextFieldRenderer.audio-beszurasa-mediatar")} />
                            <ToolbarButton isActive={editor.isActive('table')} onClick={() => setShowTableModal(true)} icon={<TableIcon size={14} />} title={t("richTextFieldRenderer.tablazat-beszurasa", "Táblázat beszúrása")} />
                            <ToolbarButton isActive={editor.isActive('mathFormula')} onClick={() => editor.chain().focus().setMathFormula({ latex: '' }).run()} icon={<Sigma size={14} />} title={t("richTextFieldRenderer.matematikai-keplet", "Matematikai képlet (LaTeX)")} />
                            <ToolbarButton
                                isActive={editor.isActive('inlineMath')}
                                onClick={() => {
                                    const { from, to } = editor.state.selection;
                                    const sel = editor.state.doc.textBetween(from, to, ' ');
                                    editor.chain().focus().insertInlineMath({ latex: sel }).run();
                                }}
                                icon={<Pi size={14} />}
                                title={t("richTextFieldRenderer.matek-karakter", "Matek karakter / szimbólum ($x$)")}
                            />
                            <ToolbarButton isActive={editor.isActive('youtube')} onClick={setYoutube} icon={<YoutubeIcon size={14} />} title={t("richTextFieldRenderer.youtube-video")} />
                            <ToolbarButton isActive={editor.isActive('coordinates')} onClick={setCoordinates} icon={<MapPin size={14} />} title={t("richTextFieldRenderer.terkep-koordinatak-beszurasa")} />
                        </div>
                    )}

                    {/* Table Context Controls (active when cursor is inside a table) */}
                    {editor && !isDisabled && !isReadOnly && editor.isActive('table') && (
                        <div className="flex flex-wrap items-center gap-1 px-6 py-1.5 border-b border-border bg-muted/40 text-[10px] text-muted-foreground animate-in fade-in shrink-0 z-20">
                            <span className="font-mono font-semibold uppercase tracking-wider text-[9px] text-foreground/80 flex items-center gap-1 mr-1">
                                <TableIcon size={11} /> {t('richTextFieldRenderer.tablazat', 'Táblázat')}:
                            </span>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addRowBefore().run()}
                                className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                            >
                                + {t('richTextFieldRenderer.sor-fele-btn', 'Sor felé')}
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                            >
                                + {t('richTextFieldRenderer.sor-ala-btn', 'Sor alá')}
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteRow().run()}
                                className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                            >
                                - {t('richTextFieldRenderer.sor-torlese-btn', 'Sor')}
                            </button>
                            <div className="w-px h-3 bg-border/60 mx-0.5" />
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addColumnBefore().run()}
                                className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                            >
                                + {t('richTextFieldRenderer.oszlop-balra-btn', 'Oszlop balra')}
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                            >
                                + {t('richTextFieldRenderer.oszlop-jobbra-btn', 'Oszlop jobbra')}
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteColumn().run()}
                                className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                            >
                                - {t('richTextFieldRenderer.oszlop-torlese-btn', 'Oszlop')}
                            </button>
                            <div className="w-px h-3 bg-border/60 mx-0.5" />
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                                className="px-1.5 py-0.5 rounded border border-border/60 hover:bg-foreground/10 hover:text-foreground transition-colors cursor-pointer"
                            >
                                {t('richTextFieldRenderer.fejlec-btn', 'Fejléc')}
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                className="ml-auto px-1.5 py-0.5 rounded border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                            >
                                {t('richTextFieldRenderer.tablazat-torlese-btn', 'Táblázat törlése')}
                            </button>
                        </div>
                    )}

                    {/* DOCUMENT WORKSPACE (DESK & ELEVATED PAPER SHEET) */}
                    <div
                        ref={deskScrollRef}
                        className="flex-1 overflow-y-auto custom-scrollbar bg-slate-200/80 dark:bg-[#07080a] relative select-text"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="min-h-full py-8 sm:py-12 pb-56 px-3 sm:px-6 flex flex-col items-center">
                            {isDragging && (
                                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm pointer-events-none">
                                    <FileText size={48} className="mb-4 animate-bounce text-foreground" />
                                    <h3 className="text-lg font-bold tracking-tight">{t("richTextFieldRenderer.ejtse-ide-a-fajlt")}</h3>
                                    <p className="text-xs uppercase tracking-widest opacity-60">{t("richTextFieldRenderer.markdown-importalasa")}</p>
                                </div>
                            )}

                            {/* ELEVATED PAPER SHEET */}
                            <div
                                ref={paperRef}
                                className={cn(
                                    "w-full bg-background rounded-lg shadow-2xl border border-border/70 transition-all duration-300 relative flex flex-col mb-12",
                                    "[&_.ProseMirror]:min-h-[850px] [&_.ProseMirror]:focus:outline-none",
                                    "[&_.ProseMirror_p]:text-base [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_p]:my-4",
                                    "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:tracking-tight [&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h1]:mb-4",
                                    "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:tracking-tight [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-3",
                                    "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-2",
                                    "[&_.ProseMirror_li]:text-base [&_.ProseMirror_li]:my-1.5",
                                    "[&_.ProseMirror_table]:text-sm",
                                    "[&_.ProseMirror_pre]:max-w-full [&_.ProseMirror_pre]:overflow-x-auto",
                                    // Elegant divider (<hr>): clean subtle line with good spacing
                                    "[&_.ProseMirror_hr]:my-8 [&_.ProseMirror_hr]:border-0 [&_.ProseMirror_hr]:border-t [&_.ProseMirror_hr]:border-border/50 [&_.ProseMirror_hr]:w-full [&_.ProseMirror_hr]:mx-0",
                                    pageWidth === 'standard' && "max-w-[850px] min-h-[1100px] p-8 sm:p-14 md:p-16",
                                    pageWidth === 'wide' && "max-w-[1150px] min-h-[1100px] p-6 sm:p-12 md:p-14",
                                    pageWidth === 'full' && "max-w-none min-h-[1000px] p-6 sm:p-10 md:p-12"
                                )}
                            >
                                {(!editor || (editor.isEmpty && !editor.isFocused)) && (
                                    <div className="absolute top-12 left-8 sm:left-14 md:left-16 pointer-events-none text-xs uppercase tracking-widest opacity-30 font-mono">
                                        // {t("richTextFieldRenderer.typingPlaceholder", "Kezdj el gépelni itt, vagy húzz be egy .md fájlt...")}
                                    </div>
                                )}

                                <EditorContent editor={editor} />
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM STATUS BAR */}
                    <div className="h-8 border-t border-border/50 bg-background/95 backdrop-blur-md px-6 flex items-center justify-between text-[11px] font-mono text-muted-foreground shrink-0 z-20">
                        <div className="flex items-center gap-3">
                            <span>{wordCount} {t("richTextFieldRenderer.szo", "szó")}</span>
                            <span className="opacity-30">•</span>
                            <span>{charCount} {t("richTextFieldRenderer.karakter", "karakter")}</span>
                            <span className="opacity-30">•</span>
                            <span>~{readingTimeMinutes} {t("richTextFieldRenderer.perc-olvasas", "perc")}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-[10px] opacity-70">
                            <span>Esc: {t("richTextFieldRenderer.visszateres", "Visszatérés")}</span>
                            <span>•</span>
                            <span>⌘B: {t("richTextFieldRenderer.felkover", "Félkövér")}</span>
                            <span>•</span>
                            <span>⌘I: {t("richTextFieldRenderer.dolt", "Dőlt")}</span>
                            <span>•</span>
                            <span>⇧⌘F: {t("richTextFieldRenderer.docsMode", "Docs nézet")}</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function ToolbarButton({
    icon,
    isActive,
    onClick,
    title,
    variant = 'toolbar',
}: {
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    title: string;
    variant?: 'toolbar' | 'menu';
}) {
    if (variant === 'menu') {
        return (
            <button
                type="button"
                onClick={onClick}
                title={title}
                className={cn(
                    "p-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center border",
                    isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary border-border/60 hover:border-border"
                )}
            >
                {icon}
            </button>
        );
    }
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn(
                "p-1.5 rounded transition-colors flex-shrink-0 cursor-pointer",
                isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
            )}
        >
            {icon}
        </button>
    );
}

