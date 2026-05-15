import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'am', 'om', 'es', 'fr', 'de'] as const;
const defaultLocale = 'en';

export default getRequestConfig(async ({requestLocale}) => {
  const requestedLocale = await requestLocale;
  const locale = locales.includes(requestedLocale as (typeof locales)[number])
    ? requestedLocale
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
