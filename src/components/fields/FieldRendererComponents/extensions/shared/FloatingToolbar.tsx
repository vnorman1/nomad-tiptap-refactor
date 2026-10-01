/**
 * FloatingToolbar Component
 *
 * Floating context-aware toolbar for text selection in inline editor
 * Appears above/below text selection with three button groups:
 * 1. Text formatting: bold, italic, underline, strikethrough, code, superscript, subscript, link
 * 2. Block formatting: paragraph, heading levels (h1-h6), blockquote, bullet list, ordered list, code block
 * 3. Insert: insert table, insert math formula, insert inline math, insert image, insert video, insert audio
 *
 * @requirements 7.2, 7.3, 7.4, 7.8, 7.9, 14.1, 14.3
 * Property 9: Muted Mode Prevents UI Rendering Based on Editor State
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useEditor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Strikethrough,
  Link,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table,
  Plus,
  Image,
  Video,
  Music,
  Superscript,
  Subscript,
} from 'lucide-react';
import { useFloatingToolbar } from './useFloatingToolbar';
import { Toolbar_Button } from './toolbar/Toolbar_Button';
import { ToolbarGroup } from './toolbar/ToolbarGroup';
import { ToolbarSeparator } from './toolbar/ToolbarSeparator';
import type { FloatingPosition } from '../../types/editor';

export interface FloatingToolbarProps {
  /** The Tiptap editor instance */
  editor: ReturnType<typeof useEditor> | null;
  /** Whether the toolbar should be enabled (respects editor disabled/readOnly state) */
  enabled?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * FloatingToolbar - Context-aware floating toolbar for text selection
 *
 * Renders three button groups:
 * 1. Text formatting (bold, italic, underline, strikethrough, code, superscript, subscript, link)
 * 2. Block formatting (paragraph, h1-h6, blockquote, bullet list, ordered list, code block)
 * 3. Insert (table, math formula, inline math, image, video, audio)
 *
 * Shows when non-empty text is selected and editor is enabled
 */
export const FloatingToolbar = React.forwardRef<
  HTMLDivElement,
  FloatingToolbarProps
>(({ editor, enabled = true, className = '' }, ref) => {
  const { t } = useTranslation(['editor', 'common']);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<FloatingPosition>({ top: 0, left: 0 });
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get toolbar positioning from hook - only enabled if editor is not disabled/readonly
  const { isVisible: hookIsVisible, position: hookPosition } = useFloatingToolbar({
    enabled: enabled && editor?.isEditable,
  });

  // Handle toolbar visibility with fade effect
  useEffect(() => {
    if (hookIsVisible) {
      // Show toolbar
      setIsFading(false);
      setIsVisible(true);
      setPosition(hookPosition);
      // Clear any pending fade timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    } else {
      // Fade out toolbar
      setIsFading(true);
      fadeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, 100);
    }

    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [hookIsVisible, hookPosition]);

  if (!editor || !isVisible) {
    return null;
  }

  // Calculate toolbar transform to center it horizontally
  // The toolbar width is controlled by CSS, so we use -50% to center
  const toolbarStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
    transform: 'translateX(-50%)',
    zIndex: 999999,
    opacity: isFading ? 0 : 1,
    transition: 'opacity 100ms ease-out',
    pointerEvents: isFading ? 'none' : 'auto',
  };

  return createPortal(
    <div
      ref={ref}
      style={toolbarStyle}
      className={`flex gap-2 items-center bg-background border border-border rounded-md shadow-lg p-2 ${className}`}
    >
      {/* Group 1: Text Formatting */}
      <ToolbarGroup>
        <Toolbar_Button
          icon={<Bold size={16} />}
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title={t('editor:richTextUpdate.toolbar.bold', 'Bold')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Italic size={16} />}
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title={t('editor:richTextUpdate.toolbar.italic', 'Italic')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Underline size={16} />}
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title={t('editor:richTextUpdate.toolbar.underline', 'Underline')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Strikethrough size={16} />}
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title={t('editor:richTextUpdate.toolbar.strikethrough', 'Strikethrough')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Code size={16} />}
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title={t('editor:richTextUpdate.toolbar.code', 'Code')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Superscript size={16} />}
          isActive={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          title={t('editor:richTextUpdate.toolbar.superscript', 'Superscript')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Subscript size={16} />}
          isActive={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          title={t('editor:richTextUpdate.toolbar.subscript', 'Subscript')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Link size={16} />}
          isActive={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt(
              t('editor:richTextUpdate.toolbar.link_prompt', 'Enter URL:')
            );
            if (!url) return;
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
          title={t('editor:richTextUpdate.toolbar.link', 'Link')}
          variant="toolbar"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Group 2: Block Formatting */}
      <ToolbarGroup>
        <Toolbar_Button
          icon={<span className="text-sm font-bold">¶</span>}
          isActive={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title={t('editor:richTextUpdate.toolbar.paragraph', 'Paragraph')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Heading1 size={16} />}
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title={t('editor:richTextUpdate.toolbar.heading_1', 'Heading 1')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Heading2 size={16} />}
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title={t('editor:richTextUpdate.toolbar.heading_2', 'Heading 2')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Heading3 size={16} />}
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title={t('editor:richTextUpdate.toolbar.heading_3', 'Heading 3')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Quote size={16} />}
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title={t('editor:richTextUpdate.toolbar.blockquote', 'Blockquote')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<List size={16} />}
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title={t('editor:richTextUpdate.toolbar.bullet_list', 'Bullet List')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<ListOrdered size={16} />}
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title={t('editor:richTextUpdate.toolbar.ordered_list', 'Ordered List')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={
            <span
              className="text-sm font-mono border border-current rounded px-1"
              style={{ fontSize: '10px' }}
            >
              {'<>'}
            </span>
          }
          isActive={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title={t('editor:richTextUpdate.toolbar.code_block', 'Code Block')}
          variant="toolbar"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Group 3: Insert */}
      <ToolbarGroup>
        <Toolbar_Button
          icon={<Table size={16} />}
          isActive={false}
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          }}
          title={t('editor:richTextUpdate.toolbar.insert_table', 'Insert Table')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Plus size={16} />}
          isActive={false}
          onClick={() => {
            editor.chain().focus().setMathFormula({ latex: '' }).run();
          }}
          title={t('editor:richTextUpdate.toolbar.insert_math', 'Insert Math Formula')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={
            <span
              className="text-sm font-mono"
              style={{ fontSize: '14px', lineHeight: 1 }}
            >
              ∫
            </span>
          }
          isActive={false}
          onClick={() => {
            editor.chain().focus().insertInlineMath({ latex: '' }).run();
          }}
          title={t('editor:richTextUpdate.toolbar.insert_inline_math', 'Insert Inline Math')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Image size={16} />}
          isActive={false}
          onClick={() => {
            const url = window.prompt(t('editor:richTextUpdate.toolbar.image_url', 'Image URL:'));
            if (!url) return;
            editor.chain().focus().setImage({ src: url, alt: '' }).run();
          }}
          title={t('editor:richTextUpdate.toolbar.insert_image', 'Insert Image')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Video size={16} />}
          isActive={false}
          onClick={() => {
            const url = window.prompt(t('editor:richTextUpdate.toolbar.video_url', 'Video URL:'));
            if (!url) return;
            editor.chain().focus().setVideo({ src: url, alt: '' }).run();
          }}
          title={t('editor:richTextUpdate.toolbar.insert_video', 'Insert Video')}
          variant="toolbar"
        />
        <Toolbar_Button
          icon={<Music size={16} />}
          isActive={false}
          onClick={() => {
            const url = window.prompt(t('editor:richTextUpdate.toolbar.audio_url', 'Audio URL:'));
            if (!url) return;
            editor.chain().focus().setAudio({ src: url, alt: '' }).run();
          }}
          title={t('editor:richTextUpdate.toolbar.insert_audio', 'Insert Audio')}
          variant="toolbar"
        />
      </ToolbarGroup>
    </div>,
    document.body
  );
});

FloatingToolbar.displayName = 'FloatingToolbar';
