'use client'
import Image from 'next/image'
import Link from 'next/link'
import GithubIcon from '@/assets/icons/github.svg'
import { useState } from 'react'
import { cn } from '@/utils.cn'
import { BluegateLoader } from '@/components/blugate-loader'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isError = Boolean(error)

  if (isLoading) return <BluegateLoader />

  return (
    <div className="border-border container flex flex-1 flex-col items-center border font-sans">
      {/* {isLoading && <BluegateLoader />} */}
      <main className="flex w-full flex-1 flex-col items-center justify-between gap-30 px-16 py-12">
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

          <p className="mx-auto max-w-180 text-center text-xl leading-[180%] font-medium tracking-[-2%] text-pretty text-[#CACACA]">
            Paste a suspicious repo. Bluegate tells you what it tries to run
            before you do
          </p>
        </div>

        <div className="w-full max-w-209">
          <div className="flex">
            <div
              className={cn(
                'border-border grid size-18 shrink-0 place-items-center border',
                isError && 'border-red'
              )}
            >
              <GithubIcon />
            </div>
            <input
              type="text"
              className={cn(
                'border-border h-18 w-full border-y px-6 py-5 text-lg font-medium text-[#EBEBEB] placeholder:text-[#666666] focus:outline-none',
                isError && 'border-red'
              )}
              placeholder="https://github.com/user-name/repo-name"
            />
            <button className="border-border h-18 shrink-0 border bg-[#FAFAFA] px-12 text-xl font-semibold text-[#1F1F1F] hover:bg-[color-mix(in_srgb,#FAFAFA,#1F1F1F_15%)]">
              Analyse
            </button>
          </div>

          <div className="text-red mt-4 ml-24 h-6 font-medium">{error}</div>
        </div>

        <div></div>

        <div className="flex w-full items-center justify-between gap-4 text-xl font-medium text-[#8F8F8F]">
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
        </div>
      </main>
    </div>
  )
}

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#support', label: 'Support Us' },
  { href: 'https://bluethroatlabs.com', label: 'Bluethroat Labs' },
]
