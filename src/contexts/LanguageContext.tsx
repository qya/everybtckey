import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first, then browser language
    const saved = localStorage.getItem('language') as Language;
    if (saved && translations[saved]) return saved;
    
    // Try to match browser language
    const browserLang = navigator.language.toLowerCase();
    
    // Direct matches
    if (translations[browserLang as Language]) {
      return browserLang as Language;
    }
    
    // Language code matches (e.g., 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0];
    if (translations[langCode as Language]) {
      return langCode as Language;
    }
    
    // Special cases
    if (browserLang.includes('zh')) {
      if (browserLang.includes('tw') || browserLang.includes('hk') || browserLang.includes('mo')) {
        return 'zh-tw';
      }
      return 'zh-cn';
    }
    
    return 'en'; // Default fallback
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}