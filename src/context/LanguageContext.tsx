import React, { createContext, useContext, useState } from 'react';
import { I18N_CONFIG } from '@/config/admin.config';

interface LanguageContextType {
    activeLanguage: string;
    setActiveLanguage: (lang: string) => void;
    availableLanguages: string[];
    defaultLanguage: string;
    isI18nEnabled: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    activeLanguage: 'hu',
    setActiveLanguage: () => {},
    availableLanguages: ['hu', 'en'],
    defaultLanguage: 'hu',
    isI18nEnabled: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [activeLanguage, setActiveLanguage] = useState<string>(I18N_CONFIG.defaultLanguage || 'hu');

    const value: LanguageContextType = {
        activeLanguage,
        setActiveLanguage,
        availableLanguages: I18N_CONFIG.languages || ['hu'],
        defaultLanguage: I18N_CONFIG.defaultLanguage || 'hu',
        isI18nEnabled: I18N_CONFIG.enabled || false,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
