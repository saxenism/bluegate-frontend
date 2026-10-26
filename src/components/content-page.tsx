import type { ReactNode } from 'react'
import { cn } from 'cn'
import { SiteShell } from './site-shell'
import { SiteButtonLink } from './ui/site-button'

export function ContentPage({
  title,
  lead,
  children,
  paper = false,
}: {
  title: string
  lead: string
  children: ReactNode
  paper?: boolean
}) {
  const article = (
    <article
      className={cn(
        paper
          ? 'paper-article mx-auto w-full max-w-272 [border-width:var(--paper-border)] border-solid border-transparent px-2 text-(--ink) scheme-light drop-shadow-[0_18px_20px_rgb(0_0_0/53%)] [--paper-border:64px_24px_60px] md:px-4 md:[--paper-border:100px_64px_92px]'
          : 'border-y border-(--rule) bg-(--panel)'
      )}
      aria-labelledby="page-title"
    >
      <header
        className={cn(
          'flex flex-wrap items-start justify-between gap-5 border-b border-(--rule)',
          paper ? 'pb-7' : 'p-5'
        )}
      >
        <div className="max-w-[75ch]">
          <h1
            id="page-title"
            className={cn(
              'font-serif font-normal text-balance',
              paper
                ? 'text-[44px] md:text-[clamp(44px,6vw,72px)]'
                : 'text-[38px]',
              'leading-[1.1]'
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              'mt-3 max-w-[72ch] text-sm leading-[1.75] text-(--ink-2)',
              paper && 'md:text-base'
            )}
          >
            {lead}
          </p>
        </div>
        <SiteButtonLink href="/">New scan</SiteButtonLink>
      </header>
      <div
        className={cn(
          'text-sm leading-[1.8] wrap-anywhere text-(--ink-2) [&_a]:text-(--ink) [&_a]:underline [&_a]:decoration-(--control-rule) [&_a]:underline-offset-4 [&_a:hover]:decoration-(--ink) [&_code]:bg-(--panel-2) [&_code]:px-1.25 [&_code]:py-0.5 [&_code]:text-[0.92em] [&_code]:text-(--ink) [&_h2]:mt-9 [&_h2]:mb-3.5 [&_h2]:font-serif [&_h2]:text-[30px] [&_h2]:leading-[1.15] [&_h2]:font-normal [&_h2]:text-(--ink) [&_h2:first-child]:mt-0 [&_li+li]:mt-3 [&_strong]:font-semibold [&_strong]:text-(--ink) [&_ul]:list-[square] [&_ul]:pl-5.5 [&>*+*]:mt-5',
          paper
            ? 'max-w-[75ch] pt-7 md:text-base'
            : 'max-w-[95ch] px-5 pt-7 pb-10'
        )}
      >
        {children}
      </div>
      {paper && (
        <p className="mt-10 border-t border-(--rule) pt-5 text-xs leading-[1.55] text-(--ink-3)">
          BlueGate by Bluethroat Labs
        </p>
      )}
    </article>
  )

  return (
    <SiteShell>
      {paper ? (
        <div className="border-y border-(--rule) bg-[#111] bg-[linear-gradient(#0006,#0006),url('/assets/footer-bg-dark.webp')] bg-cover bg-center px-2 py-4 md:p-6">
          {article}
        </div>
      ) : (
        article
      )}
    </SiteShell>
  )
}
