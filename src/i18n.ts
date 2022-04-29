import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import XHR from 'i18next-xhr-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

i18next
    .use(XHR)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        backend: {
            crossDomain: true,
            loadPath() {
                return 'https://raw.githubusercontent.com/mars-protocol/translations/master/{{lng}}.json'
            },
        },
        react: {
            useSuspense: true,
        },
        fallbackLng: ['en'],
        preload: ['en'],
        keySeparator: '.',
        interpolation: { escapeValue: false },
        lowerCaseLng: true,
        load: 'languageOnly',
    })

export default i18next