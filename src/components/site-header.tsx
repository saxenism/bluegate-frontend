'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { SITE_LINKS } from '@/lib/site'
import { FullLogo } from '@/lib/logos'
import { cn } from 'cn'

export function SiteHeader() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex flex-wrap items-stretch justify-between border-y border-(--rule) md:flex-nowrap">
      <a
        className="flex min-h-16 w-full items-center border-b border-(--rule) px-5 py-3.5 md:w-auto md:border-r md:border-b-0 md:px-6 md:py-4.5"
        href="https://bluethroatlabs.com"
        aria-label="Bluethroat Labs home"
      >
        <FullLogo />
      </a>
      <nav
        className="ml-auto flex w-full items-stretch md:w-auto"
        aria-label="Main navigation"
      >
        {SITE_LINKS.slice(0, 3).map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? 'page' : undefined}
            className={cn(
              'flex min-h-13 flex-1 items-center justify-center border-l border-(--rule) px-2 py-2.5 text-xs leading-[1.55] font-semibold text-(--ink-2) transition-colors duration-150 ease-out first:border-l-0 hover:bg-(--panel-2) hover:text-(--ink) md:min-h-18 md:flex-none md:px-5 md:py-3 md:text-base md:first:border-l',
              pathname === href &&
                'bg-(--panel-2) text-(--ink) underline underline-offset-5'
            )}
          >
            {label}
          </Link>
        ))}
        <button
          className="flex min-h-13 w-13 shrink-0 items-center justify-center border-l border-(--rule) p-3 text-(--ink-2) transition-colors duration-150 ease-out hover:bg-(--panel-2) hover:text-(--ink) md:min-h-18 md:w-18"
          type="button"
          aria-label="Toggle light and dark theme"
          title="Toggle light and dark theme"
          onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        >
          <SunIcon className="hidden size-6 dark:block" aria-hidden="true" />
          <MoonIcon className="size-6 dark:hidden" aria-hidden="true" />
        </button>
      </nav>
    </header>
  )
}
