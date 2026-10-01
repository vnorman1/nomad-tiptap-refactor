/**
 * CoordinatesNodeView Component
 * React NodeView for coordinate/map nodes with floating action row
 * 
 * Features:
 * - Renders embedded map iframe
 * - Floating action row on hover with copy coordinates and delete buttons
 * - 150ms opacity fade transitions for action row
 * - Displays latitude and longitude info
 * 
 * Validates: Requirements 3.2, 3.3
 */

import React, { useState, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps, type ReactNodeViewProps } from '@tiptap/react';
import { Copy, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Helper to check if coordinates are valid
 */
function hasValidCoordinates(lat: string | null | undefined, lng: string | null | undefined): boolean {
  if (!lat || !lng) return false;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return !isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
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
      <span className="text-sm text-muted-foreground">Invalid coordinates</span>
    </div>
  );
}

/**
 * CoordinatesNodeView - React component for coordinate/map nodes
 */
export const CoordinatesNodeView: React.FC<ReactNodeViewProps | NodeViewProps> = ({
  node,
  deleteNode,
  selected,
}) => {
  const { t } = useTranslation(['editor']);
  
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { lat, lng } = node.attrs;
  const hasValidCoords = hasValidCoordinates(lat, lng);
  const mapUrl = hasValidCoords ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed` : '';

  const handleCopyCoordinates = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasValidCoords) {
      const coordString = `${lat},${lng}`;
      showCopyFeedback(coordString);
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
      {/* Map container with border styling */}
      <div
        className={`relative w-full rounded overflow-hidden border transition-all ${
          selected ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg' : 'border-border/60 hover:border-foreground/40'
        }`}
      >
        {hasValidCoords ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="400"
            style={{ aspectRatio: '16 / 9', border: 'none' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block select-none"
            draggable="false"
          />
        ) : (
          <BrokenMediaWarning />
        )}
      </div>

      {/* Floating action row */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border border-border rounded-md shadow-lg p-1 transition-opacity duration-150 pointer-events-none ${
          isHovering ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      >
        {/* Coordinates info - always visible when hovering */}
        {hasValidCoords && (
          <div className="px-1.5 py-1 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
            {lat}, {lng}
          </div>
        )}

        {/* Copy coordinates button */}
        <button
          type="button"
          onClick={handleCopyCoordinates}
          title={t('editor:toolbar.copy-coordinates')}
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

export default CoordinatesNodeView;
