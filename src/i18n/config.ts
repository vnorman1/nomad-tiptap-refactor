import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
    .use(initReactI18next)
    .init({
        lng: 'hu',
        fallbackLng: 'hu',
        resources: {
            hu: {
                common: {},
                editor: {},
            },
            en: {
                common: {},
                editor: {},
            },
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
