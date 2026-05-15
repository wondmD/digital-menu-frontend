# Multilingual Setup - Installation & Setup Instructions

## Prerequisites

- Node.js 18+ installed
- pnpm or npm installed
- Your Next.js project already set up

## Installation Steps

### 1. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

This will install the `next-intl` package which is required for the multilingual setup.

### 2. Verify File Structure

Ensure all these files are in place:

```
✓ messages/
  ├── en.json
  ├── am.json
  ├── om.json
  ├── es.json
  ├── fr.json
  └── de.json

✓ lib/i18n/
  ├── config.ts
  ├── navigation.ts
  └── request.ts

✓ components/
  ├── language-switcher.tsx
  └── locale-provider.tsx

✓ app/[locale]/
  ├── layout.tsx
  └── page.tsx

✓ middleware.ts
✓ i18n.config.ts
✓ next.config.mjs (updated)
✓ package.json (updated)
```

### 3. Start Development Server

```bash
npm run dev
# or
pnpm dev
```

The app will start at `http://localhost:3000`

### 4. Test the Setup

1. **Visit the home page in English:**
   ```
   http://localhost:3000/en
   ```

2. **Visit the home page in Amharic:**
   ```
   http://localhost:3000/am
   ```

3. **Test the language switcher:**
   - Click the globe icon in the header
   - Select a different language
   - Verify the URL and content change

4. **Try other languages:**
   ```
   http://localhost:3000/en  - English
   http://localhost:3000/am  - Amharic
   http://localhost:3000/om  - Oromo
   http://localhost:3000/es  - Spanish
   http://localhost:3000/fr  - French
   http://localhost:3000/de  - German
   ```

## Building for Production

```bash
npm run build
npm start
```

## Supported Languages Reference

| Language | Code | Flag | Native Name |
|----------|------|------|------------|
| English | `en` | 🇬🇧 | English |
| Amharic | `am` | 🇪🇹 | አማርኛ |
| Oromo | `om` | 🇪🇹 | Afan Oromo |
| Spanish | `es` | 🇪🇸 | Español |
| French | `fr` | 🇫🇷 | Français |
| German | `de` | 🇩🇪 | Deutsch |

## Quick Start - Migrate Your First Page

Follow these steps to convert an existing page to multilingual:

### Step 1: Move the file
```bash
# Move your page under [locale]
# From: app/login/page.tsx
# To: app/[locale]/login/page.tsx
```

### Step 2: Add translations
Use translations in your component:
```tsx
import {useTranslations} from 'next-intl';

export default function LoginPage() {
  const t = useTranslations();
  
  return <h1>{t('auth.login')}</h1>;
}
```

### Step 3: Test
```bash
# Visit http://localhost:3000/en/login
# Try different languages: /am/login, /om/login, etc.
```

See `MIGRATION_GUIDE.md` for detailed examples.

## Configuration

### Main Configuration Files

**`i18n.config.ts`** - Main i18n settings
```ts
export default {
  locales: ['en', 'am', 'om', 'es', 'fr', 'de'],
  defaultLocale: 'en',
  localePrefix: 'always',
};
```

**`lib/i18n/navigation.ts`** - Navigation utilities
```ts
export const locales = ['en', 'am', 'om', 'es', 'fr', 'de'] as const;
```

**`middleware.ts`** - Handles locale routing
- Automatically adds locale prefix to URLs
- Detects and preserves user's language preference

## Adding a New Language

Want to add Portuguese, Chinese, or another language?

### 1. Create Translation File
Create `messages/pt.json` with your translations

### 2. Update Config Files
Update these files to include your new locale:
- `lib/i18n/config.ts`
- `lib/i18n/navigation.ts`
- `lib/i18n/request.ts`
- `components/language-switcher.tsx` (add flag and name)

### 3. Test
```bash
npm run build  # Verify no errors
npm run dev
# Visit http://localhost:3000/pt
```

See `I18N_GUIDE.md` for more details.

## Environment Variables

No special environment variables are required for i18n to work, but you can optionally set:

```bash
# .env.local (optional)
# Default behavior works without these
```

## Troubleshooting

### Pages not loading?
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### 404 errors on non-[locale] routes?
All routes must be under `[locale]`. Make sure routes are structured as:
- ✓ `app/[locale]/login/page.tsx`
- ✗ `app/login/page.tsx` (won't work)

### Translations showing [key] instead of text?
- Check that the key exists in `messages/[locale].json`
- Verify JSON syntax is valid
- Check that you're using correct namespace

### Build takes too long?
- This is normal, next-intl compiles all locales
- Can be optimized with proper caching

## IDE Setup

### VS Code
Install these extensions for better i18n support:
- **JSON** - Built-in support for translation files
- **Thunder Client** or **REST Client** - Test API routes

### Enable Type Checking
```bash
npm run lint
```

## Performance

- **Bundle size**: ~10KB gzip for next-intl
- **Runtime overhead**: Minimal, uses server-side rendering
- **Build time**: ~2-3 seconds per locale

## Documentation Files

- **`I18N_GUIDE.md`** - Complete reference guide
- **`MIGRATION_GUIDE.md`** - How to migrate existing pages
- **`SETUP_INSTRUCTIONS.md`** (this file) - Installation steps

## Next Steps

1. ✓ Verify setup by visiting http://localhost:3000/en
2. Read `MIGRATION_GUIDE.md` to convert existing pages
3. Start migrating your pages one by one
4. Test language switching functionality
5. Deploy and monitor for issues

## Support & Resources

- **next-intl Documentation**: https://next-intl-docs.vercel.app/
- **GitHub Issues**: Check project issues for common problems
- **Community**: Share your setup on Twitter/social media

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Clean build
rm -rf .next && npm run build
```

## Deployment

Works with all major platforms:
- **Vercel** (recommended) - Native Next.js support
- **Netlify** - Set build command to `npm run build`
- **Docker** - Build: `npm run build`, Start: `npm start`
- **Self-hosted** - Same as Docker

## Monitoring

After deployment, monitor:
1. Language switching functionality
2. Correct content displayed per language
3. Build size growth (shouldn't be significant)
4. Performance metrics

## Feedback & Improvements

The i18n setup includes:
- ✓ 6 languages (English, Amharic, Oromo, Spanish, French, German)
- ✓ Full type safety with TypeScript
- ✓ Server & client component support
- ✓ SEO-friendly locale routing
- ✓ Easy language switching
- ✓ Extensible for future languages

---

**Happy coding!** 🌍

Questions? See the detailed guides:
- Technical details → `I18N_GUIDE.md`
- Page migration → `MIGRATION_GUIDE.md`
