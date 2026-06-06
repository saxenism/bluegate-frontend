'use client'

import { BluegateLoader } from '@/components/blugate-loader'
import { Report } from '@/components/report'
import { LINKS } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getScanReport, mapApiErrorToInlineMessage } from '@/lib/api'
import { cacheReport, getCachedReport } from '@/lib/report-cache'
import { useEffect } from 'react'

export default function ReportPage() {
  const params = useParams<{ id: string | string[] }>()
  const scanId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const { data, isLoading, error } = useQuery({
    queryKey: ['scan-report', scanId],
    enabled: Boolean(scanId),
    staleTime: Infinity,
    queryFn: async () => {
      if (!scanId) throw new Error('Missing scan ID')
      return getScanReport(scanId)
    },
    initialData: scanId ? (getCachedReport(scanId) ?? undefined) : undefined,
  })

  useEffect(() => {
    if (!scanId || !data) return
    cacheReport(scanId, data)
  }, [scanId, data])

  if (isLoading) return <BluegateLoader />

  if (!scanId || !data || error) {
    return (
      <div className="border-border container flex flex-1 flex-col items-center border font-sans">
        <main className="flex w-full flex-1 flex-col items-center justify-center px-8 py-12">
          <p className="text-red text-base font-medium">
            {error ? mapApiErrorToInlineMessage(error) : 'Report not found'}
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="border-border container flex flex-1 flex-col items-center border px-0 font-sans">
      <main className="flex w-full flex-1 flex-col items-center py-12">
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

        <Report data={data} scanId={scanId} />

        <footer className="flex w-full items-center justify-between gap-4 px-12 text-xl font-medium text-[#8F8F8F] max-md:flex-col">
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
