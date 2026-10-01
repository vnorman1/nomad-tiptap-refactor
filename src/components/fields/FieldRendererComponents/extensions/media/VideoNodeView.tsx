/**
 * VideoNodeView Component
 * React NodeView for video nodes with floating action row
 * 
 * Features:
 * - Renders video element with controls
 * - Floating action row on hover with copy URL, edit alt text, delete buttons
 * - 150ms opacity fade transitions for action row
 * - Alt text badge with color feedback
 * - Inline alt text editor on badge click
 * 
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6
 */

import React, { useState, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps, type ReactNodeViewProps } from '@tiptap/react';
import { Copy, Trash2, X } from 'lucide-react';
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
    <div className="flex items-center justify-center w-full aspect-video bg-muted/30 border-2 border-dashed border-destructive/50 rounded-lg gap-2">
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
      <span className="text-sm text-muted-foreground">Invalid video URL</span>
    </div>
  );
}

/**
 * VideoNodeView - React component for video nodes
 */
export const VideoNodeView: React.FC<ReactNodeViewProps | NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { t } = useTranslation(['editor']);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempAlt, setTempAlt] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { src, alt } = node.attrs;
  const isValidUrl = isValidMediaUrl(src);
  const hasAlt = alt && String(alt).trim().length > 0;

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempAlt(alt || '');
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
      {/* Video container with border styling */}
      <div
        className={`relative w-full rounded overflow-hidden border transition-all ${
          selected ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg' : 'border-border/60 hover:border-foreground/40'
        }`}
      >
        {isValidUrl ? (
          <video
            src={src}
            controls
            className="w-full h-auto block select-none aspect-video"
            draggable="false"
          />
        ) : (
          <BrokenMediaWarning />
        )}

        {/* ALT indicator badge */}
        {!isEditing && isValidUrl && (
          <button
            type="button"
            onClick={handleStartEdit}
            title={hasAlt ? t('editor:richTextExtensions.alt-kattints-a-szerkeszteshez') : t('editor:richTextExtensions.nincs-alt-szoveg')}
            className={`absolute top-1.5 right-1.5 flex items-center justify-center px-1.5 h-4 text-[8px] font-mono font-bold uppercase tracking-wider rounded-sm z-10 backdrop-blur-sm transition-all ${
              hasAlt
                ? 'bg-emerald-500/85 text-white hover:bg-emerald-500'
                : 'bg-black/50 text-white mix-blend-difference hover:bg-black/70'
            }`}
          >
            {t('editor:richTextExtensions.alt')}
          </button>
        )}
      </div>

      {/* Floating action row */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border border-border rounded-md shadow-lg p-1 transition-opacity duration-150 pointer-events-none ${
          isHovering && !isEditing ? 'opacity-100 pointer-events-auto' : 'opacity-0'
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

        {/* Edit ALT button - only show for videos with valid URLs */}
        {isValidUrl && (
          <button
            type="button"
            onClick={handleStartEdit}
            title={t('editor:toolbar.edit-alt-text')}
            className="p-1.5 rounded hover:bg-muted/50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}

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

      {/* Alt text editor popover */}
      {isEditing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1.5 right-1.5 w-60 bg-background border border-border/60 shadow-xl rounded-lg p-3 z-20 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">
              {t('editor:richTextExtensions.alt-szoveg')}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-muted-foreground/60 hover:text-foreground transition-colors -mr-1"
              title={t('editor:richTextExtensions.megse-esc')}
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
            placeholder={t('editor:richTextExtensions.video-leirasa')}
            className="w-full bg-background border border-border/60 rounded px-2 py-1.5 text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10 transition-all"
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSaveAlt()}
              className="flex-1 px-2 py-1 bg-foreground/10 hover:bg-foreground/15 border border-border/60 text-muted-foreground hover:text-foreground text-[10px] font-mono uppercase tracking-wider rounded transition-colors"
              title={t('editor:richTextExtensions.mentes-enter')}
            >
              {t('editor:richTextExtensions.mentes')}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 px-2 py-1 bg-muted/20 hover:bg-muted/30 border border-border/60 text-muted-foreground hover:text-foreground text-[10px] font-mono uppercase tracking-wider rounded transition-colors"
              title={t('editor:richTextExtensions.megse-esc')}
            >
              {t('editor:richTextExtensions.megse')}
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default VideoNodeView;
