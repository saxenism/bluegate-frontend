import { LINKS } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="border-border container flex flex-1 flex-col items-center border font-sans">
      <main className="flex w-full flex-1 flex-col items-center justify-between gap-12 px-8 py-12 md:px-16">
        <Link href="/">
          <Image
            src="/logo/full.svg"
            alt="Next.js logo"
            width={177}
            height={48}
            className="mx-auto h-12 w-auto select-none"
            priority
          />
        </Link>

        <div className="space-y-10 text-center">
          <p className="text-center text-[clamp(7rem,18vw,12rem)] leading-none font-semibold tracking-[-0.04em] text-[#EBEBEB] select-none">
            404
          </p>

          <p className="mx-auto max-w-180 text-center text-base leading-[180%] font-medium tracking-[-2%] text-pretty text-[#CACACA] md:text-xl">
            We checked. This page doesn&apos;t exist and never tried to install
            anything.
          </p>

          <Link
            href="/"
            className="border-border inline-flex h-15 shrink-0 items-center border bg-[#FAFAFA] px-8 text-lg font-semibold text-[#1F1F1F] hover:bg-[color-mix(in_srgb,#FAFAFA,#1F1F1F_15%)] md:h-18 md:px-12 md:text-xl"
          >
            Back to the gate
          </Link>
        </div>

        <div></div>

        <footer className="flex w-full items-center justify-between gap-4 text-xl font-medium text-[#8F8F8F] max-md:flex-col">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              className="hover:text-[#CACACA] hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </footer>
      </main>
    </div>
  )
}
