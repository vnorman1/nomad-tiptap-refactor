import React, { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'forbidden';

interface UIContextType {
    showToast: (type: ToastType, title: string, message?: string) => void;
}

const UIContext = createContext<UIContextType>({
    showToast: (type, title, message) => {
        console.log(`[Toast ${type}] ${title}`, message || '');
    },
});

export function UIProvider({ children }: { children: React.ReactNode }) {
    const showToast = (type: ToastType, title: string, message?: string) => {
        console.log(`[Toast ${type}] ${title}`, message || '');
    };

    return (
        <UIContext.Provider value={{ showToast }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    return useContext(UIContext);
}
