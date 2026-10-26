import { SiteButtonLink } from '@/components/ui/site-button'
import { SiteShell } from '@/components/site-shell'

export default function NotFound() {
  return (
    <SiteShell>
      <section className="flex min-h-80 flex-col items-start justify-center gap-6 border-y border-(--rule) px-6 py-10">
        <h1 className="font-serif text-[clamp(38px,6vw,64px)] leading-[1.1]">
          Page not found
        </h1>
        <p className="max-w-[65ch] text-sm leading-[1.8] text-(--ink-2)">
          We checked. This page doesn&apos;t exist and never tried to install
          anything.
        </p>
        <SiteButtonLink href="/">Back to the scanner</SiteButtonLink>
      </section>
    </SiteShell>
  )
}
