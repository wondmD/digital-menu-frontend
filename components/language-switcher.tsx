'use client';

import React, { useTransition } from 'react';
import { locales, type Locale } from '@/lib/i18n/navigation';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const localeNames: Record<string, string> = {
  en: '🇬🇧 English',
  am: '🇪🇹 አማርኛ (Amharic)',
  om: '🇪🇹 Afan Oromo',
  es: '🇪🇸 Español',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const stripLocalePrefix = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const first = segments[0];

    if (first && (locales as readonly string[]).includes(first)) {
      const rest = segments.slice(1);
      return rest.length ? `/${rest.join('/')}` : '/';
    }

    return path || '/';
  };

  const handleLanguageChange = (newLocale: Locale) => {
    const basePath = stripLocalePrefix(pathname || '/');
    const query = searchParams.toString();
    const localizedPath = `/${newLocale}${basePath === '/' ? '' : basePath}${query ? `?${query}` : ''}`;

    startTransition(() => {
      router.replace(localizedPath);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Languages</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(locales as Locale[]).map((loc) => (
          <DropdownMenuItem
            key={loc}
            onSelect={() => handleLanguageChange(loc)}
            disabled={isPending}
            className={loc === locale ? 'bg-accent' : ''}
          >
            {localeNames[loc]}
            {loc === locale && ' ✓'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
