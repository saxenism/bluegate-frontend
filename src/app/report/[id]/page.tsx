'use client'

import { BluegateLoader } from '@/components/blugate-loader'
import { Report } from '@/components/report'
import { SiteShell } from '@/components/site-shell'
import { SiteButton, SiteButtonLink } from '@/components/ui/site-button'
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
      <div className="bg-background text-foreground flex min-h-dvh flex-1 font-mono leading-normal tracking-normal">
        <BluegateLoader
          status={data?.status}
          repo={data?.input.repo}
          polling
          error={waitingError ? mapApiErrorToInlineMessage(waitingError) : null}
        />
      </div>
    )

  if (!validId || !data || (error && !isTerminalScan(data))) {
    const retryable = error && isRetryableScanError(error)
    return (
      <SiteShell>
        <section className="flex min-h-80 flex-col items-start justify-center gap-6 border-y border-(--rule) px-6 py-10">
          <h1 className="font-serif text-[clamp(38px,6vw,64px)] leading-[1.1]">
            {validId ? 'Report unavailable' : 'Invalid report link'}
          </h1>
          <p
            role="alert"
            className="max-w-[65ch] text-sm leading-[1.8] text-(--error)"
          >
            {validId
              ? mapApiErrorToInlineMessage(error)
              : 'This link is invalid or belongs to the previous scanner. Start a new scan to use the current API.'}
          </p>
          {retryable && (
            <p className="max-w-[65ch] text-sm leading-[1.8] text-(--ink-2)">
              {error instanceof BluegateApiError && error.retryAfter
                ? `Waiting ${error.retryAfter} seconds before the next automatic check.`
                : 'Checking again automatically. You can return to this link later.'}
            </p>
          )}
          {validId && !retryable && (
            <SiteButton type="button" onClick={() => void query.refetch()}>
              Try again
            </SiteButton>
          )}
          <Link href="/" className="text-base underline underline-offset-4">
            Start a new scan
          </Link>
        </section>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="bg-background text-foreground flex w-full min-w-0 flex-col items-center border-b border-(--rule) pb-12 font-mono leading-normal tracking-normal">
        {error && (
          <p role="alert" className="mb-6 px-6 text-sm text-(--scan-partial)">
            Showing the saved report. {mapApiErrorToInlineMessage(error)}
          </p>
        )}
        {data.status === 'failed' && (
          <div
            role="alert"
            className="border-border mb-6 w-full border-y p-6 text-(--scan-failed)"
          >
            {data.error || 'The scan failed before analysis could finish.'}
            {data.error_code && (
              <span className="mt-2 block text-sm">{data.error_code}</span>
            )}
          </div>
        )}
        <Report data={data} scanId={scanId} />
      </div>
    </SiteShell>
  )
}
