import { isScanDocument, type ScanDocument } from '@/lib/types'

const STORAGE_KEY = 'bluegate:reports:v2'
const MAX_ITEMS = 10

function readCache(): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? '{}'
    )
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function getCachedReport(scanId: string): ScanDocument | undefined {
  const value = readCache()[scanId]
  // Never pin an in-flight, failed, expired, or old-schema response in storage.
  if (
    !isScanDocument(value) ||
    value.scan_id !== scanId ||
    value.status !== 'done'
  )
    return undefined
  if (
    !value.valid_until ||
    !Number.isFinite(Date.parse(value.valid_until)) ||
    Date.parse(value.valid_until) <= Date.now()
  )
    return undefined
  return value
}

export function cacheReport(scanId: string, report: ScanDocument) {
  if (
    report.status !== 'done' ||
    !report.valid_until ||
    !Number.isFinite(Date.parse(report.valid_until)) ||
    Date.parse(report.valid_until) <= Date.now()
  )
    return
  try {
    const entries = Object.entries(readCache()).filter(([id]) => id !== scanId)
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        Object.fromEntries([...entries, [scanId, report]].slice(-MAX_ITEMS))
      )
    )
    window.localStorage.removeItem('bluegate:reports:v1')
  } catch {
    /* Disabled/full storage must not prevent opening a report. */
  }
}
