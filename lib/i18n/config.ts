import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';

export const locales = ['en', 'am', 'om', 'es', 'fr', 'de'];
export const defaultLocale = 'en';

export function getLocaleFromRequest(): string {
  try {
    const headersList = headers();
    const acceptLanguage = headersList.get('accept-language') || '';
    
    // Parse accept-language header
    const preferredLocale = acceptLanguage
      .split(',')[0]
      .split('-')[0]
      .toLowerCase();
    
    // Check if it's a supported locale
    if (locales.includes(preferredLocale)) {
      return preferredLocale;
    }
  } catch (error) {
    console.error('Error parsing locale from request:', error);
  }
  
  return defaultLocale;
}

export function isValidLocale(locale: string): boolean {
  return locales.includes(locale);
}
