import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { t, Locale, i18n } from '@haimish/shared';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/bn/') || path === '/bn') return 'bn';
    }
    return 'en';
  });

  useEffect(() => {
    const path = window.location.pathname;
    const newLocale: Locale = path.startsWith('/bn/') || path === '/bn' ? 'bn' : 'en';
    setLocale(newLocale);
  }, []);

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    const currentPath = window.location.pathname;
    let newPath: string;
    
    if (newLocale === 'bn') {
      newPath = currentPath === '/' ? '/bn' : `/bn${currentPath}`;
    } else {
      newPath = currentPath.replace(/^\/bn/, '') || '/';
    }
    
    window.history.pushState({}, '', newPath);
  }, []);

  const translate = useCallback((key: string, params?: Record<string, string>) => {
    return t(key, locale, params);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t: translate }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}