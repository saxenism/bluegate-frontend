'use client'

import Image from 'next/image'
import Link from 'next/link'
import GithubIcon from '@/assets/icons/github.svg'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { BluegateLoader } from '@/components/blugate-loader'
import { LINKS } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import {
  BluegateApiError,
  createScan,
  getScanReport,
  getScanStatus,
  mapApiErrorToInlineMessage,
  normalizeGithubRepoUrl,
} from '@/lib/api'
import { cacheReport } from '@/lib/report-cache'
import { useQueryClient } from '@tanstack/react-query'

const SCAN_POLL_INTERVAL_MS = 3000
const SCAN_MAX_POLLS = 120

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isError = Boolean(error)
  const router = useRouter()
  const queryClient = useQueryClient()

  const runScanFlow = async () => {
    let shouldStopLoading = true

    const { normalizedUrl, error: validationError } = normalizeGithubRepoUrl(
      repoUrl.trim()
    )

    if (validationError || !normalizedUrl) {
      setError(validationError || 'invalid URL')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const scan = await createScan(normalizedUrl)

      for (let attempt = 0; attempt < SCAN_MAX_POLLS; attempt++) {
        const status = await getScanStatus(scan.scan_id)

        if (status.status === 'failed') {
          throw new BluegateApiError(
            status.error?.code || 'scan_failed',
            status.error?.message || 'Scan failed',
            409
          )
        }

        if (status.status === 'completed') {
          const report = await getScanReport(scan.scan_id)
          cacheReport(scan.scan_id, report)
          queryClient.setQueryData(['scan-report', scan.scan_id], report)
          shouldStopLoading = false
          router.push(`/report/${scan.scan_id}`)
          return
        }

        await sleep(SCAN_POLL_INTERVAL_MS)
      }

      throw new BluegateApiError(
        'scan_timeout',
        'Scan timed out, please try again.',
        408
      )
    } catch (err) {
      setError(mapApiErrorToInlineMessage(err))
    } finally {
      if (shouldStopLoading) {
        setIsLoading(false)
      }
    }
  }

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
                value={repoUrl}
                className={cn(
                  'border-border h-14 w-full border-y px-4 py-2.5 text-base font-medium placeholder:text-[#666666] focus:outline-none max-md:border-r md:h-18 md:px-6 md:py-5 md:text-lg',
                  isError && 'border-red'
                )}
                placeholder="https://github.com/user-name/repo-name"
                onChange={(event) => {
                  setRepoUrl(event.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  void runScanFlow()
                }}
              />
            </div>
            <button
              className="border-border h-14 shrink-0 border bg-[#FAFAFA] px-12 text-lg font-semibold text-[#1F1F1F] hover:bg-[color-mix(in_srgb,#FAFAFA,#1F1F1F_15%)] max-md:w-full md:h-18 md:text-xl"
              onClick={() => {
                void runScanFlow()
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
