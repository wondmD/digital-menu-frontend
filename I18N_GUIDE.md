# Multilingual Setup Documentation

This guide explains how the i18n (internationalization) system is configured and how to use it in your application.

## Supported Languages

- **English (en)** - 🇬🇧
- **Amharic (am)** - 🇪🇹 አማርኛ
- **Afan Oromo (om)** - 🇪🇹 Afan Oromo
- **Spanish (es)** - 🇪🇸
- **French (fr)** - 🇫🇷
- **German (de)** - 🇩🇪

## Project Structure

```
project-root/
├── messages/                 # Translation files
│   ├── en.json             # English translations
│   ├── am.json             # Amharic translations
│   ├── om.json             # Oromo translations
│   ├── es.json             # Spanish translations
│   ├── fr.json             # French translations
│   └── de.json             # German translations
├── lib/i18n/
│   ├── config.ts           # i18n configuration
│   ├── navigation.ts       # Navigation utilities
│   └── request.ts          # Server-side request config
├── components/
│   ├── language-switcher.tsx   # Language selector component
│   └── locale-provider.tsx     # Locale context provider
├── app/[locale]/           # All routes use locale parameter
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── middleware.ts           # i18n routing middleware
└── i18n.config.ts         # Main i18n configuration
```

## How It Works

### Routing
- All routes are prefixed with the locale: `/en/menu`, `/am/menu`, `/om/menu`, etc.
- The middleware automatically handles locale detection and routing
- Default locale is English (`en`)

### Translation Files
Translations are organized in JSON files under the `messages/` directory. Each file follows this structure:

```json
{
  "common": { ... },
  "navigation": { ... },
  "hero": { ... },
  "auth": { ... },
  "errors": { ... },
  "messages": { ... }
}
```

## How to Use Translations

### In Server Components
```tsx
import {useTranslations} from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  
  return <h1>{t('common.logo')}</h1>;
}
```

### In Client Components
First add `'use client'` at the top:
```tsx
'use client';

import {useTranslations} from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  
  return <h1>{t('common.menu')}</h1>;
}
```

### Using Navigation
```tsx
'use client';

import {Link} from '@/lib/i18n/navigation';

export default function Navigation() {
  return (
    <Link href="/menu">
      Menu
    </Link>
  );
}
```

### Switching Languages
Use the `LanguageSwitcher` component which is already integrated:
```tsx
import {LanguageSwitcher} from '@/components/language-switcher';

export default function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

## Adding New Translation Keys

1. **Add to all language files**:
   - Open `messages/en.json`, `messages/am.json`, etc.
   - Add your new key in the appropriate category

Example:
```json
{
  "features": {
    "newFeature": "New Feature Title"
  }
}
```

2. **Use in your component**:
```tsx
const t = useTranslations();
return <h1>{t('features.newFeature')}</h1>;
```

## Adding a New Language

1. **Create a new translation file** in `messages/`:
   ```bash
   messages/pt.json  # Portuguese
   ```

2. **Update configuration files**:
   - Add locale to `lib/i18n/config.ts`:
     ```ts
     export function isValidLocale(locale: string): boolean {
       return locales.includes(locale);
     }
     ```
   - Add locale to `lib/i18n/navigation.ts`:
     ```ts
     export const locales = ['en', 'am', 'om', 'es', 'fr', 'de', 'pt'] as const;
     ```
   - Add locale to `lib/i18n/request.ts`:
     ```ts
     const locales = ['en', 'am', 'om', 'es', 'fr', 'de', 'pt'];
     ```
   - Add locale to `middleware.ts` (no changes needed, reads from config)

3. **Update LanguageSwitcher** in `components/language-switcher.tsx`:
   ```tsx
   const localeNames: Record<string, string> = {
     // ... existing locales
     pt: '🇵🇹 Português',
   };
   ```

4. **Install packages**:
   ```bash
   npm install
   # or
   pnpm install
   ```

## Locale Detection

The system automatically detects the user's preferred language from:
1. URL path (e.g., `/am/menu` → Amharic)
2. Explicit language switcher selection
3. Browser Accept-Language header (fallback)

## TypeScript Support

The i18n system is fully typed:
```tsx
import {useLocale} from 'next-intl';
import {Locale} from '@/lib/i18n/navigation';

export default function Component() {
  const locale: Locale = useLocale();
  // TypeScript knows locale is one of: 'en' | 'am' | 'om' | 'es' | 'fr' | 'de'
}
```

## Troubleshooting

### Translations not loading?
- Ensure all translation keys are present in all language files
- Check that the JSON syntax is valid
- Verify the locale parameter is in the URL

### Language switcher not working?
- Make sure it's wrapped in a client component (`'use client'`)
- Check that all locales are defined in `lib/i18n/navigation.ts`

### Build errors?
- Install dependencies: `npm install` or `pnpm install`
- Clear build cache: `rm -rf .next`
- Rebuild: `npm run build`

## Best Practices

1. **Keep translations organized** - Use logical grouping (common, navigation, auth, etc.)
2. **Use nested keys** - Avoid flat structures for easier maintenance
3. **Translate all user-facing text** - Don't leave hardcoded English strings
4. **Test all languages** - Verify text rendering in RTL and LTR languages
5. **Monitor translation completeness** - Ensure all keys exist in all languages

## Environment Setup

Make sure these dependencies are installed:
```bash
npm install next-intl
```

The system requires:
- Next.js 13+ (with App Router)
- React 18+

## Support for RTL Languages

If you add RTL languages (Arabic, Hebrew, etc.), update the locale provider:
```tsx
// In components/locale-provider.tsx
const rtlLocales = ['ar', 'he'];
const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
document.documentElement.dir = dir;
```

## Performance Considerations

- Translations are loaded server-side and passed to client components
- Language switching uses Next.js transitions for smooth UX
- No additional API calls needed for translations
- All translation files are bundled with your app

## Future Enhancements

Consider adding:
- Translation management UI for non-developers
- Automated translation updates via CMS
- A/B testing for different languages
- User language preference persistence
- Translation completeness monitoring
