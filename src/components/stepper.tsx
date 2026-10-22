import type { ScanStatus } from '@/lib/types'

const STATUS_LABELS: Record<ScanStatus, string> = {
  queued: 'Waiting for a scanner',
  fetching: 'Fetching the pinned repository',
  analysing: 'Analysing the repository',
  done: 'Opening the report',
  failed: 'The scan did not finish',
}

export function Stepper({
  status,
  message,
}: {
  status?: ScanStatus
  message?: string
}) {
  return (
    <p className="text-center text-xl leading-relaxed text-white">
      {message || (status ? STATUS_LABELS[status] : 'Loading the scan')}
    </p>
  )
}
