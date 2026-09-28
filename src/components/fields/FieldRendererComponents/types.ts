import React from 'react';
import type { FieldConfig } from '@/config/admin.config';

// Demo getCentralAlt implementáció
export function getCentralAlt(_urlOrFilename?: unknown): Record<string, string> {
    return {
        hu: 'Demo alternatív szöveg',
        en: 'Demo alternative text'
    };
}

// --- INTERFACES ---

export interface FieldRendererProps {
    field: FieldConfig;
    value: any;
    onChange: (value: any) => void;
    disabled?: boolean;
    hasError?: boolean;
    activeBlockId?: string | null;
    hideAltEditor?: boolean;
    currentLanguage?: string;
    instantUpload?: boolean;
    onSave?: (value?: any, keepOpen?: boolean) => Promise<any> | void;
    slotKey?: string;
    itemId?: string | number | null;
    isDraftSaving?: boolean;
    lastDraftSave?: Date | null;
    showDraftRecovery?: boolean;
    hasPendingDraft?: boolean;
    pendingDraft?: any;
    onRestoreDraft?: () => void;
    onDiscardDraft?: () => void;
}

export interface BaseFieldProps extends FieldRendererProps {
    isDisabled: boolean;
    isReadOnly: boolean;
    safeValue: any;
    hasError?: boolean;
    badge?: React.ReactNode;
    currentLanguage?: string;
}

// Minimal types for media/alt compatibility
export interface PendingImage {
    file: File;
    preview: string;
    _isPending: true;
}

export interface PendingFile {
    file: File;
    _isPendingFile: true;
}

export interface PendingVideo {
    file: File;
    preview: string;
    _isPendingVideo: true;
}

export interface PendingAudio {
    file: File;
    preview: string;
    _isPendingAudio: true;
}

export type GalleryItem = string | PendingImage;
export interface StoredFileInfo {
    filename: string;
    url: string;
    prettyUrl?: string;
    size: number;
    originalName: string;
    encrypted: boolean;
}

export function isPendingImage(value: unknown): value is PendingImage {
    return typeof value === 'object' && value !== null && '_isPending' in value && (value as PendingImage)._isPending === true;
}

export function isPendingFile(value: unknown): value is PendingFile {
    return typeof value === 'object' && value !== null && '_isPendingFile' in value && (value as PendingFile)._isPendingFile === true;
}

export function isPendingVideo(value: unknown): value is PendingVideo {
    return typeof value === 'object' && value !== null && '_isPendingVideo' in value && (value as PendingVideo)._isPendingVideo === true;
}

export function isPendingAudio(value: unknown): value is PendingAudio {
    return typeof value === 'object' && value !== null && '_isPendingAudio' in value && (value as PendingAudio)._isPendingAudio === true;
}

export function getImageDisplayUrl(value: unknown): string {
    if (isPendingImage(value)) return value.preview;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && 'src' in value) return getImageDisplayUrl((value as any).src);
    return '';
}

export function getVideoDisplayUrl(value: unknown): string {
    if (isPendingVideo(value)) return value.preview;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && 'src' in value) return getVideoDisplayUrl((value as any).src);
    return '';
}

export function getAudioDisplayUrl(value: unknown): string {
    if (isPendingAudio(value)) return value.preview;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null && 'src' in value) return getAudioDisplayUrl((value as any).src);
    return '';
}

// --- SHARED COMPONENTS ---

export const Label = ({
    children,
    required,
    badge
}: {
    children: React.ReactNode;
    required?: boolean;
    badge?: React.ReactNode;
}) => {
    return React.createElement(
        'div',
        { className: 'flex items-center gap-2 mb-2' },
        React.createElement('div', {
            className: `w-1.5 h-1.5 rounded-full ${required ? 'bg-red-500' : 'bg-primary'}`
        }),
        React.createElement(
            'label',
            { className: 'text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-medium' },
            children,
            required ? React.createElement('span', { className: 'text-red-500' }, ' *') : null,
            badge ? React.createElement('span', { className: 'text-[9px] bg-secondary/80 px-1.5 py-0.5 rounded text-foreground/80' }, badge) : null
        )
    );
};
