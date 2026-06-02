'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function ReportPage() {
  return (
    <div className="border-border container flex flex-1 flex-col items-center border px-0 font-sans">
      <main className="flex w-full flex-1 flex-col items-center justify-between gap-30 py-12">
        <header className="border-border mb-18 flex w-full justify-between border-y">
          <Link
            href="/"
            className="border-border grid h-14 shrink-0 place-items-center border-r px-8 md:h-18 md:px-12"
          >
            <Image
              src="/logo/full.svg"
              alt="Next.js logo"
              width={118}
              height={32}
              className="h-6 w-auto select-none md:h-8"
              priority
            />
          </Link>

          <Link
            href="/"
            className="border-border grid h-14 shrink-0 place-items-center border-l px-8 text-base font-semibold text-[#E6E6E6] hover:bg-[#FAFAFA] hover:text-[#1F1F1F] md:h-18 md:px-12 md:text-xl"
          >
            New Scan
          </Link>
        </header>

        <section></section>

        <footer></footer>
      </main>
    </div>
  )
}
