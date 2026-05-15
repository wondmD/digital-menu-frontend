'use client';

import React from 'react';
import {useLocale} from 'next-intl';

export function LocaleProvider({children}: {children: React.ReactNode}) {
  const locale = useLocale();

  React.useEffect(() => {
    // Set HTML lang attribute for accessibility and SEO
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
