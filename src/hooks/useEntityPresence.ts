export interface UseEntityPresenceOptions {
    slotKey?: string;
    itemId?: string | number | null;
    enabled?: boolean;
    cleanupOnUnmount?: boolean;
}

export function useEntityPresence(_options?: UseEntityPresenceOptions) {
    return {
        otherEditors: [] as string[],
        isConcurrent: false,
        entityKey: '',
        loading: false,
    };
}
