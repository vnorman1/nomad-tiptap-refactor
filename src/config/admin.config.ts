// ═══════════════════════════════════════════════════════════════════════════
// Admin Config - Standalone for RichText refactor
// ═══════════════════════════════════════════════════════════════════════════

export const LOGGING_CONFIG = {
    logActions: {
        create: true,
        update: true,
        delete: true,
        login: true,
        logout: true,
    },
    logSlots: [] as string[],
};

export const CONTENT_BATCHING_CONFIG = {
    enabled: true,
    maxKeysPerBatch: 25,
    timeoutMs: 10000,
};

export const I18N_CONFIG = {
    enabled: false,
    defaultLanguage: 'hu',
    languages: ['hu', 'en'],
};

// Mezőtípus definíciók
export type FieldType =
    | 'text'
    | 'textarea'
    | 'richtext'
    | 'number'
    | 'email'
    | 'url'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'image'
    | 'gif'
    | 'gallery'
    | 'color'
    | 'json'
    | 'array'
    | 'file'
    | 'slug'
    | 'map'
    | 'iframe'
    | 'blocks'
    | 'video'
    | 'audio'
    | 'relation'
    | 'relation_many';

export interface FileFieldConfig {
    allowedTypes?: string[];
    maxSizeMB?: number;
    secure?: boolean;
}

export interface FieldConfig {
    id: string;
    label: string;
    description?: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: { label: string; value: any }[];
    relationSlot?: string;
    relationDisplayField?: string;
    defaultValue?: any;
    disabled?: boolean;
    readOnly?: boolean;
    hidden?: boolean;
    fileConfig?: FileFieldConfig;
    rows?: number;
    min?: number;
    max?: number;
    step?: number;
    accept?: string;
    maxFiles?: number;
    maxSize?: number;
    itemType?: FieldType;
    fields?: FieldConfig[];
    localized?: boolean;
    [key: string]: any;
}

export interface SlotConfig {
    name: string;
    icon?: string;
    type: 'single' | 'collection';
    fields: FieldConfig[];
    isSitemap?: boolean;
    [key: string]: any;
}

export type AdminConfig = Record<string, SlotConfig>;

export const ADMIN_CONFIG: AdminConfig = {};

export function getSlotIcon(_key: string): string {
    return 'File';
}

export function getSitemapKeys(): string[] {
    return [];
}

export async function initializeSchema(): Promise<void> {}

export function isSchemaLoaded(): boolean {
    return true;
}

export function getSchemaVersion(): string | null {
    return '1.0.0';
}