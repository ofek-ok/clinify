import React, { createContext, useState, useEffect, useCallback } from 'react';

export const LanguageContext = createContext();

const STORAGE_KEY = 'clinify_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'he';
  });

  useEffect(() => {
    const direction = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.body.dataset.language = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const toggleLanguage = () => setLanguage(prev => (prev === 'he' ? 'en' : 'he'));
  const setAppLanguage = (next) => setLanguage(next === 'en' ? 'en' : 'he');

  const t = useCallback((enString, heString) => (
    language === 'he' ? heString : enString
  ), [language]);

  const dir = language === 'he' ? 'rtl' : 'ltr';
  const isRtl = language === 'he';

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setAppLanguage, t, dir, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};
