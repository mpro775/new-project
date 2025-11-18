import { useTranslation } from 'react-i18next';

// Hook for easy translation
export const useT = (namespace?: string) => {
  const { t, i18n } = useTranslation(namespace);

  return {
    t,
    i18n,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
    currentLanguage: i18n.language,
    isRTL: i18n.dir() === 'rtl',
  };
};
