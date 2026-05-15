import {Config} from 'next-intl';

const baseConfig = {
  locales: ['en', 'am', 'om', 'es', 'fr', 'de'],
  defaultLocale: 'en',
  localePrefix: 'always',
} as const;

export default baseConfig;
