/**
 * AudioNodeView Component
 * React NodeView for audio nodes with floating action row
 * 
 * Features:
 * - Renders audio element with controls
 * - Floating action row on hover with copy URL and delete buttons
 * - 150ms opacity fade transitions for action row
 * - No alt text support for audio (audio elements don't display alt text)
 * 
 * Validates: Requirements 3.2, 3.3
 */

import React, { useState, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps, type ReactNodeViewProps } from '@tiptap/react';
import { Copy, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Helper to check if a URL is valid (starts with http://, https://, /, ./, or ../)
 */
function isValidMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return false;
  }
  const schemes = ['http://', 'https://', '/', './', '../'];
  return schemes.some(scheme => url.startsWith(scheme));
}

/**
 * Helper to show copy feedback
 */
function showCopyFeedback(text: string) {
  try {
    navigator.clipboard.writeText(text).catch(() => {
      console.error('Failed to copy to clipboard');
    });
  } catch (error) {
    console.error('Copy to clipboard error:', error);
  }
}

/**
 * BrokenMediaWarning Component
 */
function BrokenMediaWarning() {
  return (
    <div className="flex items-center justify-center w-full bg-muted/30 border-2 border-dashed border-destructive/50 rounded-lg gap-2 p-4">
      <svg
        className="w-6 h-6 text-destructive/50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm text-muted-foreground">Invalid audio URL</span>
    </div>
  );
}

/**
 * AudioNodeView - React component for audio nodes
 */
export const AudioNodeView: React.FC<ReactNodeViewProps | NodeViewProps> = ({
  node,
  deleteNode,
  selected,
}) => {
  const { t } = useTranslation(['editor']);
  
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { src } = node.attrs;
  const isValidUrl = isValidMediaUrl(src);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (src) {
      showCopyFeedback(src);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode();
  };

  return (
    <NodeViewWrapper
      ref={containerRef}
      className="relative my-4 w-full leading-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Audio container with border styling */}
      <div
        className={`relative w-full rounded overflow-hidden border transition-all ${
          selected ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg' : 'border-border/60 hover:border-foreground/40'
        }`}
      >
        {isValidUrl ? (
          <audio
            src={src}
            controls
            className="w-full h-auto block select-none"
            draggable="false"
          />
        ) : (
          <BrokenMediaWarning />
        )}
      </div>

      {/* Floating action row */}
      <div
        className={`absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border border-border rounded-md shadow-lg p-1 transition-opacity duration-150 pointer-events-none ${
          isHovering ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      >
        {/* Copy URL button */}
        <button
          type="button"
          onClick={handleCopyUrl}
          title={t('editor:toolbar.copy-url')}
          className="p-1.5 rounded hover:bg-muted/50 transition-colors"
        >
          <Copy size={14} className="text-foreground" />
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          title={t('editor:toolbar.delete')}
          className="p-1.5 rounded hover:bg-destructive/20 transition-colors"
        >
          <Trash2 size={14} className="text-destructive" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export default AudioNodeView;
