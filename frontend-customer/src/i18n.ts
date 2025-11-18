import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import enLanding from './locales/en/landing.json';
import arLanding from './locales/ar/landing.json';

// Translation resources
const resources = {
  en: {
    translation: enCommon,
    landing: enLanding,
  },
  ar: {
    translation: arCommon,
    landing: arLanding,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    // Default language
    fallbackLng: 'ar',

    // Default namespace
    defaultNS: 'translation',
    ns: ['translation', 'landing'],

    // Debug mode in development
    debug: import.meta.env.DEV,

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React options
    react: {
      useSuspense: false,
    },
  });

// Set document direction and language based on current language
i18n.on('languageChanged', (lng) => {
  const direction = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;

  // Update UI store if available
  try {
    // We can't import here due to circular dependency, so we'll use a timeout
    setTimeout(() => {
      // Import dynamically to avoid circular dependency
      import('./store').then(({ useUiStore }) => {
        useUiStore.getState().syncLanguageWithI18n();
      }).catch(error => {
        console.warn('Could not sync UI store with i18n:', error);
      });
    }, 100);
  } catch (error) {
    console.warn('Could not update UI store on language change:', error);
  }
});

export default i18n;
