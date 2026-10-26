import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

export type AppLanguage = 'en' | 'hi' | 'mr';

export const SUPPORTED_LANGUAGES: { code: AppLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

const LANGUAGE_STORAGE_KEY = 'rootguard_language';
const AUTH_STORAGE_KEY = 'rootguard_user_profile_v2';

function getInitialLanguage(): AppLanguage {
  try {
    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang === 'en' || storedLang === 'hi' || storedLang === 'mr') {
      return storedLang;
    }

    const authStored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authStored) {
      const parsed = JSON.parse(authStored);
      if (parsed?.language === 'en' || parsed?.language === 'hi' || parsed?.language === 'mr') {
        return parsed.language;
      }
    }
  } catch (e) {
    console.warn('Could not read initial language preference:', e);
  }

  return 'en';
}

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

function applyLanguageFontClasses(lang: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    if (lang === 'hi' || lang === 'mr') {
      document.documentElement.classList.add('lang-devanagari');
    } else {
      document.documentElement.classList.remove('lang-devanagari');
    }
  }
}

// Apply initially
applyLanguageFontClasses(initialLang);

// Listen to language changes
i18n.on('languageChanged', (lng) => {
  applyLanguageFontClasses(lng);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch (e) {
    console.warn('Could not store language to localStorage:', e);
  }
});

export function setAppLanguage(lang: AppLanguage) {
  i18n.changeLanguage(lang);
}

export function getSpeciesCareInstructions(speciesId: string, defaultText: string): string {
  const key = `speciesGuide.speciesCare.${speciesId}`;
  if (i18n.exists(key)) {
    return i18n.t(key);
  }
  return defaultText;
}

export function getLocalizedSpeciesName(speciesKeyOrName: string, defaultNameOrT?: string | any): string {
  const fallback = typeof defaultNameOrT === 'string' ? defaultNameOrT : undefined;
  if (!speciesKeyOrName) return fallback || '';
  // First try direct key
  const directKey = `speciesNames.${speciesKeyOrName}`;
  if (i18n.exists(directKey)) {
    return i18n.t(directKey);
  }
  // Try normalized slug key (e.g. "Neem" -> "neem", "Silver Oak" -> "silveroak")
  const slug = speciesKeyOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const slugKey = `speciesNames.${slug}`;
  if (i18n.exists(slugKey)) {
    return i18n.t(slugKey);
  }
  return fallback || speciesKeyOrName;
}

export function getLocalizedImageAlt(key: string, defaultAlt: string, options?: Record<string, string | number>): string {
  const fullKey = `images.${key}`;
  if (i18n.exists(fullKey)) {
    return i18n.t(fullKey, options);
  }
  return defaultAlt;
}

export default i18n;
