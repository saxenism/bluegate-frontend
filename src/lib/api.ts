import { API_BASE_URL } from '@/lib/constants'
import {
  isRecord,
  isScanDocument,
  isScanId,
  isScanSubmission,
  type ReportFormat,
  type ScanDocument,
  type ScanSubmission,
} from '@/lib/types'

export class BluegateApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly retryAfter?: number
  ) {
    super(message)
    this.name = 'BluegateApiError'
  }
}

async function parseError(res: Response) {
  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    /* An ingress can return a non-JSON error. */
  }
  const body = isRecord(payload) ? payload : {}
  const retryAfter = Number(body.retry_after ?? res.headers.get('Retry-After'))
  return new BluegateApiError(
    typeof body.code === 'string' ? body.code : `HTTP_${res.status}`,
    typeof body.error === 'string'
      ? body.error
      : `The scanner returned an error (${res.status}). Please try again.`,
    res.status,
    Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.ceil(retryAfter)
      : undefined
  )
}

async function request(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: init?.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(45_000)])
        : AbortSignal.timeout(45_000),
    })
    if (!res.ok) throw await parseError(res)
    return res
  } catch (error) {
    if (error instanceof BluegateApiError) throw error
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new BluegateApiError(
      'CONNECTION_FAILED',
      'Could not reach the scanner. Check your connection and try again.',
      0
    )
  }
}

function scanPath(scanId: string) {
  if (!isScanId(scanId))
    throw new BluegateApiError(
      'INVALID_SCAN_ID',
      'This report link is invalid or belongs to the previous scanner. Start a new scan.',
      400
    )
  return `/scans/${scanId}`
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    throw new BluegateApiError(
      'INVALID_RESPONSE',
      'The scanner returned an unreadable response. Please try again.',
      502
    )
  }
}

export async function createScan(
  repoUrl: string,
  { ref, turnstileToken }: { ref?: string; turnstileToken?: string } = {}
): Promise<ScanSubmission> {
  const scanRef = ref?.trim()
  const res = await request('/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_url: repoUrl,
      ...(scanRef ? { ref: scanRef } : {}),
      options: { provenance: true, transitive: true },
      ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    }),
  })
  const result = await readJson(res)
  if (!isScanSubmission(result))
    throw new BluegateApiError(
      'INVALID_RESPONSE',
      'The scanner returned an unsupported response. Please try again.',
      502
    )
  return result
}

export async function getScan(
  scanId: string,
  signal?: AbortSignal
): Promise<ScanDocument> {
  const res = await request(scanPath(scanId), { signal })
  const result = await readJson(res)
  if (!isScanDocument(result) || result.scan_id !== scanId)
    throw new BluegateApiError(
      'INVALID_RESPONSE',
      'The scanner returned an unsupported report. Please try again.',
      502
    )
  return result
}

export async function downloadScanReport(
  scanId: string,
  format: ReportFormat
): Promise<Blob> {
  return (await request(`${scanPath(scanId)}?format=${format}`)).blob()
}

export const scanQueryKey = (scanId: string) => ['scan', scanId] as const

export function scanRetryDelay(error: unknown) {
  return error instanceof BluegateApiError && error.retryAfter
    ? error.retryAfter * 1000
    : 10000
}

export function isRetryableScanError(error: unknown) {
  return (
    error instanceof BluegateApiError &&
    (error.status === 0 || error.status === 429 || error.status >= 500)
  )
}

export function mapApiErrorToInlineMessage(error: unknown): string {
  if (!(error instanceof Error))
    return 'The request could not be completed. Please try again.'
  if (error instanceof BluegateApiError && error.retryAfter)
    return `${error.message} Try again in ${error.retryAfter} seconds.`
  return error.message
}

// Preserve browse URLs and their ref instead of silently scanning the default branch.
export function normalizeGithubRepoUrl(input: string): {
  normalizedUrl?: string
  error?: string
} {
  const raw = input.trim()
  if (!raw || raw.length > 2048 || /[\s\\\u0000-\u001f\u007f]/u.test(raw))
    return { error: 'Enter a valid public GitHub repository URL.' }
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { error: 'Enter a URL such as https://github.com/owner/repo.' }
  }
  if (!['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase()))
    return { error: 'Only public github.com repositories are supported.' }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.port
  )
    return { error: 'Use an HTTPS GitHub URL without credentials or a port.' }
  const authority = raw.match(/^https:\/\/([^/?#]+)/iu)?.[1]
  if (authority?.toLowerCase() !== parsed.hostname.toLowerCase())
    return { error: 'Use a GitHub URL without credentials or a port.' }
  // Inspect the original path: URL() resolves dot segments before validation.
  const path = raw.match(/^https:\/\/[^/?#]+([^?#]*)/iu)?.[1] || ''
  const segments = path.replace(/\/$/u, '').split('/').slice(1)
  const [owner, name, ...tail] = segments
  const repo = name?.replace(/\.git$/iu, '')
  if (
    !owner ||
    !/^[A-Za-z0-9_-]{1,39}$/u.test(owner) ||
    !repo ||
    !/^[A-Za-z0-9_.-]{1,100}$/u.test(repo) ||
    /^\.+$/u.test(repo)
  )
    return { error: 'Enter a valid GitHub owner and repository name.' }
  if (
    tail.length &&
    (name.toLowerCase().endsWith('.git') ||
      !(
        (['tree', 'blob'].includes(tail[0]) && Boolean(tail[1])) ||
        (tail[0] === 'commit' &&
          tail.length === 2 &&
          /^(?:[a-f\d]{40}|[a-f\d]{64})$/iu.test(tail[1]))
      ))
  )
    return {
      error: 'Use a repository URL, a branch URL, or a full commit URL.',
    }
  if (tail.some((part) => !part || part === '.' || part === '..'))
    return { error: 'Enter a valid GitHub repository or branch URL.' }
  return {
    normalizedUrl: `https://github.com/${owner}/${repo}${tail.length ? `/${tail.join('/')}` : ''}`,
  }
}
