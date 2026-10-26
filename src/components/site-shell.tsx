import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { SiteHeader } from './site-header'
import { SITE_LINKS, SOURCE_URL } from '@/lib/site'

export function SiteShell({
  children,
  home = false,
}: {
  children: ReactNode
  home?: boolean
}) {
  return (
    <div className="mx-auto min-h-dvh w-full border-x border-(--rule) bg-(--bg) py-6 text-base leading-[1.55] tracking-[-0.02em] text-(--ink) sm:max-w-160 md:max-w-3xl md:py-12 lg:max-w-5xl xl:max-w-7xl 2xl:max-w-384">
      <a
        className="fixed top-2 left-2 z-100 translate-y-[-150%] border border-(--rule) bg-(--bg) px-4 py-2.5 text-(--ink) focus:translate-y-0"
        href="#content"
      >
        Skip to content
      </a>
      <SiteHeader />
      <header
        className="mt-4 flex flex-wrap items-start gap-4 border-y border-(--rule) bg-(--panel) px-5 py-6 md:items-end md:gap-x-13.5 md:gap-y-5 md:px-6 md:pt-11 md:pb-7"
        aria-label="BlueGate"
      >
        <Link
          className="inline-flex items-center gap-2.5 md:gap-3.5"
          href="/"
          aria-label="BlueGate scanner"
        >
          <Image
            src="/logo/icon.svg"
            alt=""
            width={88}
            height={92}
            className="h-14.75 w-14 shrink-0 invert md:h-23 md:w-22 dark:invert-0"
            priority
          />
          {home ? (
            <h1 className="font-serif text-6xl leading-none font-normal tracking-[0.005em] md:text-8xl">
              BlueGate
            </h1>
          ) : (
            <p className="font-serif text-6xl leading-none font-normal tracking-[0.005em] md:text-8xl">
              BlueGate
            </p>
          )}
        </Link>
        <div className="max-w-184 flex-[1_1_100%] text-sm leading-[1.55] md:mb-1.25 md:flex-[1_1_25rem] md:text-base">
          <p>Is this commit safe to trust?</p>
          <p className="mt-1.25 text-xs leading-[1.55] text-(--ink-3) md:text-sm">
            Clone, open, install, and run. Checked once, with the evidence
            quoted.
          </p>
        </div>
      </header>
      <main
        id="content"
        className="flex flex-col gap-4.5 py-4.5 focus:outline-none"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 border-y border-(--rule) px-5 py-4 text-[13px] text-(--ink-2) md:gap-y-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span>A repository check by</span>
          <a
            href="https://bluethroatlabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center"
          >
            <Image
              src="/assets/bluethroat-wordmark.svg"
              alt="Bluethroat Labs"
              width={124}
              height={18}
              className="h-auto dark:invert"
            />
          </a>
        </div>
        <nav
          className="flex flex-wrap gap-x-4.5 md:gap-x-5"
          aria-label="BlueGate information, policies, and support"
        >
          {SITE_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center underline decoration-(--rule) underline-offset-4 hover:text-(--ink) hover:decoration-(--ink)"
            >
              {label}
            </Link>
          ))}
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center underline decoration-(--rule) underline-offset-4 hover:text-(--ink) hover:decoration-(--ink)"
          >
            Source
          </a>
        </nav>
      </footer>
    </div>
  )
}
