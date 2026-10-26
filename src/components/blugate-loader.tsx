import Link from 'next/link'
import { BluegateBar } from '@/components/bluegate-bar'
import { Stepper } from '@/components/stepper'
import type { ScanStatus } from '@/lib/types'

export function BluegateLoader({
  status,
  message,
  repo,
  polling = false,
  error,
}: {
  status?: ScanStatus
  message?: string
  repo?: string | null
  polling?: boolean
  error?: string | null
}) {
  return (
    <main
      className="border-border bg-background container flex flex-1 flex-col items-center justify-center gap-8 border py-12 text-center"
      aria-busy="true"
    >
      <div aria-hidden="true">
        <BluegateBar width={270} height={282} />
      </div>
      <div role="status" aria-live="polite" className="max-w-2xl space-y-4">
        <Stepper status={status} message={message} />
        {repo && (
          <p className="font-basic text-sm wrap-anywhere text-(--scan-muted)">
            {repo}
          </p>
        )}
        {polling && (
          <p className="font-basic text-sm text-(--scan-muted)">
            This page updates automatically. You can refresh or return to this
            link while the scan continues.
          </p>
        )}
        {error && (
          <p className="font-basic text-sm text-(--scan-partial)">
            {error} Updates will resume automatically.
          </p>
        )}
      </div>
      {polling && (
        <Link
          href="/"
          className="hover:text-foreground mt-4 text-sm underline underline-offset-4"
        >
          Start another scan
        </Link>
      )}
    </main>
  )
}
