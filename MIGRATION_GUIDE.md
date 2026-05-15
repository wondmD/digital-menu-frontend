# Quick Implementation Guide for Existing Pages

This guide shows how to migrate your existing pages to support multiple languages.

## Step 1: Restructure Your App Routes

All your existing routes need to be moved under `[locale]` parameter:

**Before:**
```
app/
├── page.tsx
├── menu/
│   └── page.tsx
├── admin/
│   └── page.tsx
└── login/
    └── page.tsx
```

**After:**
```
app/
├── [locale]/
│   ├── layout.tsx          (wraps all routes)
│   ├── page.tsx            (homepage)
│   ├── menu/
│   │   └── page.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   └── ... (all other routes)
```

## Step 2: Update Existing Components to Use Translations

### Before (Hardcoded English):
```tsx
export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <form>
        <label>Email Address</label>
        <input type="email" />
        <label>Password</label>
        <input type="password" />
        <button>Sign In</button>
      </form>
    </div>
  );
}
```

### After (With i18n):
```tsx
import {useTranslations} from 'next-intl';

export default function LoginPage() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <form>
        <label>{t('auth.email')}</label>
        <input type="email" />
        <label>{t('auth.password')}</label>
        <input type="password" />
        <button>{t('auth.signIn')}</button>
      </form>
    </div>
  );
}
```

## Step 3: Update Links and Navigation

### Before:
```tsx
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/menu">Menu</Link>
      <Link href="/admin">Admin</Link>
    </nav>
  );
}
```

### After:
```tsx
'use client';

import {Link, usePathname} from '@/lib/i18n/navigation';
import {useTranslations} from 'next-intl';

export default function Navigation() {
  const t = useTranslations('navigation');

  return (
    <nav>
      <Link href="/">{t('home')}</Link>
      <Link href="/menu">{t('menu')}</Link>
      <Link href="/admin">{t('admin')}</Link>
    </nav>
  );
}
```

## Step 4: Add Language Switcher to Your Layout

```tsx
// app/[locale]/layout.tsx
import {LanguageSwitcher} from '@/components/language-switcher';

export default function LocaleLayout({children}) {
  return (
    <html>
      <body>
        <header>
          <nav>
            {/* Your navigation */}
            <LanguageSwitcher />
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

## Step 5: Add Missing Translations

For each new translation key used in your pages:

1. Add to all language files in `messages/`
2. Example for a new feature:

**messages/en.json:**
```json
{
  "features": {
    "qrCode": "QR Code",
    "orderOnline": "Order Online",
    "trackOrder": "Track Your Order"
  }
}
```

**messages/am.json:**
```json
{
  "features": {
    "qrCode": "ያ.አር. ኮድ",
    "orderOnline": "በመስመር ላይ ትዕዛዝ ያድርጉ",
    "trackOrder": "ትዕዛዙን ይከታተሉ"
  }
}
```

## Common Patterns

### Using Translations with Form Validation:
```tsx
'use client';

import {useTranslations} from 'next-intl';
import {useForm} from 'react-hook-form';

export default function FormComponent() {
  const t = useTranslations('errors');
  const {register, formState: {errors}} = useForm();

  return (
    <form>
      <input {...register('email', {required: t('required')})} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

### Using Translations with Toast Notifications:
```tsx
'use client';

import {useTranslations} from 'next-intl';
import {toast} from 'sonner';

export default function MyComponent() {
  const t = useTranslations('messages');

  const handleSave = async () => {
    try {
      // ... save logic
      toast.success(t('saved'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Using Translations in Metadata:
```tsx
import {useTranslations} from 'next-intl';

export const metadata = {
  title: 'MenuVista - Your Translated Title',
  description: 'Your translated description',
};
```

## Testing Your Implementation

### Test Language Switching:
1. Go to `http://localhost:3000/en/menu`
2. Click the language switcher
3. Verify URL changes to `/am/menu`, `/om/menu`, etc.
4. Verify content updates

### Test Routing:
- Try accessing `/login` directly
- Should redirect to `/en/login` (default locale)

### Test Navigation Links:
- Verify all links update the locale in the URL
- Verify content is in the correct language

## Common Issues and Solutions

### Issue: "useTranslations is not a function"
**Solution:** Make sure you're importing it from 'next-intl':
```tsx
import {useTranslations} from 'next-intl';
```

### Issue: Translation key not found
**Solution:** Ensure the key exists in all language files:
```bash
# Check all files
grep -r "keyName" messages/
```

### Issue: Links not updating language
**Solution:** Use the navigation utilities from '@/lib/i18n/navigation':
```tsx
import {Link} from '@/lib/i18n/navigation';
```

### Issue: Build failure
**Solution:** Reinstall dependencies:
```bash
npm install
npm run build
```

## File Migration Checklist

- [ ] Create `app/[locale]/` directory structure
- [ ] Move routes under `[locale]/`
- [ ] Update `layout.tsx` files
- [ ] Replace hardcoded strings with translations
- [ ] Update all Link components
- [ ] Add LanguageSwitcher component
- [ ] Add translation keys to all language files
- [ ] Test all languages
- [ ] Test language switching
- [ ] Test routing and navigation

## Performance Tips

1. **Keep translation files lean** - Only include keys you use
2. **Organize by feature** - Group related translations
3. **Use nested namespaces** - Makes code more readable
4. **Pre-translate common UI strings** - Reduces runtime translation

## Next Steps

1. Install dependencies: `npm install`
2. Start migration with one page at a time
3. Test each page in all supported languages
4. Use the LanguageSwitcher for user language preferences
5. Consider adding more languages in the future
