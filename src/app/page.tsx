'use client'

import Image from 'next/image'
import Link from 'next/link'
import GithubIcon from '@/assets/icons/github.svg'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { BluegateLoader } from '@/components/blugate-loader'
import { LINKS } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isError = Boolean(error)
  const router = useRouter()

  if (isLoading) return <BluegateLoader />

  return (
    <div className="border-border container flex flex-1 flex-col items-center border font-sans">
      {/* {isLoading && <BluegateLoader />} */}
      <main className="flex w-full flex-1 flex-col items-center justify-between gap-12 px-8 py-12 md:gap-30 md:px-16">
        <div></div>

        <div className="space-y-12">
          <Image
            src="/logo/full.svg"
            alt="Next.js logo"
            width={295}
            height={80}
            className="mx-auto h-20 w-auto select-none"
            priority
          />

          <p className="font-basic mx-auto max-w-180 text-center font-medium text-pretty text-[#CACACA] md:text-xl">
            Paste a suspicious repo. Bluegate tells you what it tries to run
            before you do
          </p>
        </div>

        <div className="w-full max-w-209">
          <div className="flex max-md:flex-col">
            <div className="flex w-full">
              <div
                className={cn(
                  'border-border grid size-14 shrink-0 place-items-center border md:size-18',
                  isError && 'border-red'
                )}
              >
                <GithubIcon className="size-7 md:size-8" />
              </div>
              <input
                type="text"
                className={cn(
                  'border-border h-14 w-full border-y px-4 py-2.5 text-base font-medium placeholder:text-[#666666] focus:outline-none max-md:border-r md:h-18 md:px-6 md:py-5 md:text-lg',
                  isError && 'border-red'
                )}
                placeholder="https://github.com/user-name/repo-name"
              />
            </div>
            <button
              className="border-border h-14 shrink-0 border bg-[#FAFAFA] px-12 text-lg font-semibold text-[#1F1F1F] hover:bg-[color-mix(in_srgb,#FAFAFA,#1F1F1F_15%)] max-md:w-full md:h-18 md:text-xl"
              onClick={() => {
                router.push('/report/123')
              }}
            >
              Analyse
            </button>
          </div>

          <div className="text-red mt-4 ml-24 h-6 font-medium">{error}</div>
        </div>

        <div className="max-md:hidden"></div>

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
