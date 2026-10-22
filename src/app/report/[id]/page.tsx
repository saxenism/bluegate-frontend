'use client'

import { BluegateLoader } from '@/components/blugate-loader'
import { Report } from '@/components/report'
import { LINKS } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BluegateApiError,
  getScan,
  isRetryableScanError,
  mapApiErrorToInlineMessage,
  scanQueryKey,
  scanRetryDelay,
} from '@/lib/api'
import { cacheReport, getCachedReport } from '@/lib/report-cache'
import { isScanId, isTerminalScan } from '@/lib/types'
import { useEffect } from 'react'

export default function ReportPage() {
  const params = useParams<{ id: string }>()
  const scanId = params.id
  const validId = isScanId(scanId)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: scanQueryKey(scanId),
    enabled: validId,
    queryFn: ({ signal }) => getScan(scanId, signal),
    staleTime: 0,
    retry: (count, error) => count < 2 && isRetryableScanError(error),
    retryDelay: (_count, error) => scanRetryDelay(error),
    refetchInterval: (current) => {
      if (current.state.data && isTerminalScan(current.state.data)) return false
      if (current.state.error && !isRetryableScanError(current.state.error))
        return false
      return scanRetryDelay(
        current.state.error ?? current.state.fetchFailureReason
      )
    },
    refetchOnWindowFocus: (current) => {
      const reason = current.state.error ?? current.state.fetchFailureReason
      return !(reason instanceof BluegateApiError && reason.retryAfter)
    },
  })
  const { data, error, isLoading } = query
  const waitingError = error ?? query.failureReason

  useEffect(() => {
    const cached = getCachedReport(scanId)
    if (cached && !queryClient.getQueryData(scanQueryKey(scanId)))
      queryClient.setQueryData(scanQueryKey(scanId), cached)
  }, [scanId, queryClient])

  useEffect(() => {
    if (data) cacheReport(scanId, data)
  }, [scanId, data])

  if (
    validId &&
    (isLoading ||
      (data &&
        !isTerminalScan(data) &&
        (!error || isRetryableScanError(error))))
  )
    return (
      <BluegateLoader
        status={data?.status}
        repo={data?.input.repo}
        polling
        error={waitingError ? mapApiErrorToInlineMessage(waitingError) : null}
      />
    )

  if (!validId || !data || (error && !isTerminalScan(data))) {
    const retryable = error && isRetryableScanError(error)
    return (
      <main className="border-border container flex flex-1 flex-col items-center justify-center gap-6 border px-8 py-12 text-center">
        <h1 className="font-serif text-4xl">
          {validId ? 'Report unavailable' : 'Invalid report link'}
        </h1>
        <p role="alert" className="max-w-2xl text-base text-[#F07979]">
          {validId
            ? mapApiErrorToInlineMessage(error)
            : 'This link is invalid or belongs to the previous scanner. Start a new scan to use the current API.'}
        </p>
        {retryable && (
          <p className="text-sm text-[#A9A9A9]">
            {error instanceof BluegateApiError && error.retryAfter
              ? `Waiting ${error.retryAfter} seconds before the next automatic check.`
              : 'Checking again automatically. You can return to this link later.'}
          </p>
        )}
        {validId && !retryable && (
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="border-border border px-6 py-3 hover:bg-[#1F1F1F]"
          >
            Try again
          </button>
        )}
        <Link href="/" className="text-base underline underline-offset-4">
          Start a new scan
        </Link>
      </main>
    )
  }

  return (
    <div className="border-border container flex flex-1 flex-col items-center border px-0 font-sans">
      <main className="flex w-full min-w-0 flex-1 flex-col items-center py-12">
        <header className="border-border mb-18 flex w-full justify-between border-y">
          <Link
            href="/"
            aria-label="Bluegate home"
            className="border-border grid h-14 shrink-0 place-items-center border-r px-6 md:h-18 md:px-12"
          >
            <Image
              src="/logo/full.svg"
              alt="Bluegate"
              width={118}
              height={32}
              className="h-6 w-auto select-none md:h-8"
              priority
            />
          </Link>
          <Link
            href="/"
            className="border-border grid h-14 shrink-0 place-items-center border-l px-6 text-base font-semibold text-[#E6E6E6] hover:bg-[#FAFAFA] hover:text-[#1F1F1F] md:h-18 md:px-12 md:text-xl"
          >
            New Scan
          </Link>
        </header>
        {error && (
          <p role="alert" className="mb-6 px-6 text-sm text-[#F6C76A]">
            Showing the saved report. {mapApiErrorToInlineMessage(error)}
          </p>
        )}
        {data.status === 'failed' && (
          <div
            role="alert"
            className="border-border mb-6 w-full border-y p-6 text-[#F07979]"
          >
            {data.error || 'The scan failed before analysis could finish.'}
            {data.error_code && (
              <span className="mt-2 block text-sm">{data.error_code}</span>
            )}
          </div>
        )}
        <Report data={data} scanId={scanId} />
        <footer className="flex w-full items-center justify-between gap-4 px-8 text-base font-medium text-[#A9A9A9] max-md:flex-col lg:px-12 lg:text-xl">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={
                link.href.startsWith('http') ? 'noopener noreferrer' : undefined
              }
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
