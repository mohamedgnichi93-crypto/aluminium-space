import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tn from './locales/tn.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import en from './locales/en.json';
import it from './locales/it.json';

const resources = {
  tn: { translation: tn },
  ar: { translation: ar },
  fr: { translation: fr },
  en: { translation: en },
  it: { translation: it },
};

const savedLanguage = localStorage.getItem('app_language') || 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
