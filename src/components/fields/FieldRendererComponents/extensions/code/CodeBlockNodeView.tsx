/**
 * Code Block NodeView
 * React component that renders a code block with interactive toolbar
 * 
 * Features:
 * - Floating toolbar with language selection, wrap toggle, copy, and delete buttons
 * - Syntax highlighting support via Highlight.js class attributes
 * - Copy-to-clipboard with visual feedback
 * - Line wrap toggle state persistence
 * - Selection styling for active code blocks
 * 
 * @requirements 5.1, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { useState } from 'react';
import { NodeViewWrapper, NodeViewContent, type ReactNodeViewProps, type NodeViewProps } from '@tiptap/react';
import { CodeBlockToolbar } from './CodeBlockToolbar';

/**
 * CodeBlockNodeView Component
 * Renders a code block with toolbar, syntax highlighting, and interactive controls
 * 
 * @param props - Provided by ReactNodeViewRenderer
 * @returns JSX element
 */
export const CodeBlockNodeView: React.FC<ReactNodeViewProps | NodeViewProps> = (
  props: any
) => {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { language = 'javascript', wrapLines = false } = node.attrs;
  const [copied, setCopied] = useState(false);

  /**
   * Handle copy button click
   * Writes code content to clipboard and shows visual feedback
   */
  const handleCopy = () => {
    const text = node.textContent;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /**
   * Handle wrap toggle button click
   * Toggles between line wrapping and horizontal scroll
   */
  const handleToggleWrap = () => {
    updateAttributes({ wrapLines: !wrapLines });
  };

  /**
   * Handle language selection change
   * Updates node attributes and persists selection
   */
  const handleLanguageChange = (lang: string) => {
    updateAttributes({ language: lang });
  };

  /**
   * Handle delete button click
   * Removes the code block from the document
   */
  const handleDelete = () => {
    deleteNode();
  };

  return (
    <NodeViewWrapper
      className={`nomad-code-block not-prose my-4 rounded-xl overflow-hidden border transition-all ${
        selected
          ? 'border-primary ring-2 ring-primary/30 shadow-md'
          : 'border-border shadow-xs'
      } bg-card text-card-foreground`}
    >
      {/* Top Toolbar / Header Bar */}
      <CodeBlockToolbar
        language={language}
        wrapLines={wrapLines}
        copied={copied}
        onLanguageChange={handleLanguageChange}
        onWrapToggle={handleToggleWrap}
        onCopy={handleCopy}
        onDelete={handleDelete}
      />

      {/* Code Body with ProseMirror content */}
      <pre
        className={`!bg-secondary/15 dark:!bg-background/80 !p-4 !m-0 !border-0 font-mono text-[13px] leading-relaxed text-foreground select-text selection:bg-primary/20 ${
          wrapLines
            ? '!whitespace-pre-wrap break-words'
            : '!whitespace-pre overflow-x-auto custom-scrollbar'
        }`}
      >
        <NodeViewContent
          as={'code' as any}
          className={`${
            language
              ? `language-${language} !bg-transparent !p-0 !text-foreground`
              : '!bg-transparent !p-0 !text-foreground'
          }`}
        />
      </pre>
    </NodeViewWrapper>
  );
};

// Export display name for debugging
CodeBlockNodeView.displayName = 'CodeBlockNodeView';
