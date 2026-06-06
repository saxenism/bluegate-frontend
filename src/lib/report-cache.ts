import { BluegateReport } from '@/lib/types'

type ReportCache = Record<string, BluegateReport>

const STORAGE_KEY = 'bluegate:reports:v1'
const MAX_ITEMS = 30

function canUseStorage() {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  )
}

function safeParse(input: string | null): ReportCache {
  if (!input) return {}
  try {
    return JSON.parse(input) as ReportCache
  } catch {
    return {}
  }
}

function writeCache(cache: ReportCache) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}

function trimCache(cache: ReportCache): ReportCache {
  const entries = Object.entries(cache)
  if (entries.length <= MAX_ITEMS) return cache

  const sliced = entries.slice(entries.length - MAX_ITEMS)
  return Object.fromEntries(sliced)
}

export function getCachedReport(scanId: string): BluegateReport | null {
  if (!canUseStorage()) return null
  const cache = safeParse(window.localStorage.getItem(STORAGE_KEY))
  return cache[scanId] ?? null
}

export function cacheReport(scanId: string, report: BluegateReport) {
  if (!canUseStorage()) return
  const cache = safeParse(window.localStorage.getItem(STORAGE_KEY))
  const updated = trimCache({ ...cache, [scanId]: report })
  writeCache(updated)
}
