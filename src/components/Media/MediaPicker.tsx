import React, { useState } from 'react';
import { X, Upload, Link2, Check } from 'lucide-react';

export interface MediaItem {
    name: string;
    url: string;
    previewUrl?: string;
    size?: number;
    size_human?: string;
    mime_type?: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'other';
    modified_at?: string;
    alt?: Record<string, string>;
    title?: string;
    caption?: string;
}

interface MediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, item?: MediaItem) => void;
    onUpload?: (file: File) => Promise<string>;
    allowedTypes?: ('image' | 'video' | 'audio')[];
    title?: string;
}

export default function MediaPicker({
    isOpen,
    onClose,
    onSelect,
    allowedTypes = ['image'],
    title = 'Média kiválasztása'
}: MediaPickerProps) {
    const [urlInput, setUrlInput] = useState('');

    if (!isOpen) return null;

    const handleSelectUrl = () => {
        if (!urlInput.trim()) return;
        onSelect(urlInput.trim(), {
            name: urlInput.split('/').pop() || 'Media',
            url: urlInput.trim(),
            type: allowedTypes[0] || 'image',
        });
        setUrlInput('');
        onClose();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        onSelect(blobUrl, {
            name: file.name,
            url: blobUrl,
            size: file.size,
            mime_type: file.type,
            type: allowedTypes[0] || 'image',
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                    <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase">
                            Média URL megadása
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="https://images.unsplash.com/..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSelectUrl();
                                    }}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <button
                                onClick={handleSelectUrl}
                                disabled={!urlInput.trim()}
                                className="px-3.5 py-2 text-xs bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50 hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
                            >
                                <Check size={14} />
                                <span>Beszúrás</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-muted-foreground">vagy feltöltés</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>

                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 hover:bg-muted/10 cursor-pointer transition-colors">
                        <Upload size={24} className="text-muted-foreground mb-2" />
                        <span className="text-xs font-medium text-foreground">Kattints a feltöltéshez</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Helyi fájl kiválasztása ({allowedTypes.join(', ')})</span>
                        <input
                            type="file"
                            className="hidden"
                            accept={allowedTypes.map(t => `${t}/*`).join(',')}
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
