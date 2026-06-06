import { API_BASE_URL } from '@/lib/constants'
import { BluegateReport } from '@/lib/types'

type ApiErrorPayload = { error?: { code?: string; message?: string } }

export type ScanJobStatus = 'queued' | 'running' | 'completed' | 'failed'

export type ScanLinks = {
  status: string
  report_json: string
  report_markdown: string
}

export type ScanError = { code: string; message: string }

export type ScanJob = {
  scan_id: string
  repo_url: string
  status: ScanJobStatus
  created_at: string
  updated_at: string
  started_at?: string
  finished_at?: string
  verdict?: BluegateReport['verdict']
  error?: ScanError
  links: ScanLinks
}

export class BluegateApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message)
  }
}

const DEFAULT_SCAN_OPTIONS = {
  dependencyMetadata: true,
  includeGitHistory: true,
  includeForkDiff: true,
  strict: false,
}

// const getAuthHeaders = () => {
//   const token = process.env.NEXT_PUBLIC_BLUEGATE_API_KEY
//   if (!token) return {}
//   return { Authorization: `Bearer ${token}` }
// }

const buildUrl = (path: string) => `${API_BASE_URL}${path}`

const parseError = async (res: Response): Promise<BluegateApiError> => {
  let payload: ApiErrorPayload | null = null

  try {
    payload = (await res.json()) as ApiErrorPayload
  } catch {
    payload = null
  }

  const code = payload?.error?.code ?? `http_${res.status}`
  const message = payload?.error?.message ?? 'Request failed'
  return new BluegateApiError(code, message, res.status)
}

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as T
}

const requestBlob = async (path: string, init?: RequestInit): Promise<Blob> => {
  const res = await fetch(buildUrl(path), {
    ...init,
    headers: {
      // ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return res.blob()
}

export const createScan = async (repoUrl: string): Promise<ScanJob> => {
  return requestJson<ScanJob>('/scans', {
    method: 'POST',
    body: JSON.stringify({ repo_url: repoUrl, options: DEFAULT_SCAN_OPTIONS }),
  })
}

export const getScanStatus = async (scanId: string): Promise<ScanJob> => {
  return requestJson<ScanJob>(`/scans/${scanId}`)
}

export const getScanReport = async (
  scanId: string
): Promise<BluegateReport> => {
  return requestJson<BluegateReport>(`/scans/${scanId}/report.json`)
}

export const getReportDownloadUrl = (scanId: string, format: 'json' | 'md') => {
  const suffix = format === 'json' ? 'report.json' : 'report.md'
  return buildUrl(`/scans/${scanId}/${suffix}`)
}

export const downloadScanReport = async (
  scanId: string,
  format: 'json' | 'md'
): Promise<Blob> => {
  const suffix = format === 'json' ? 'report.json' : 'report.md'
  return requestBlob(`/scans/${scanId}/${suffix}`)
}

export const mapApiErrorToInlineMessage = (error: unknown): string => {
  if (!(error instanceof Error)) return 'Request failed'

  const code = error instanceof BluegateApiError ? error.code : ''
  const lower = error.message.toLowerCase()

  if (
    code === 'invalid_repo_url' ||
    lower.includes('valid https://github.com') ||
    lower.includes('form https://github.com') ||
    lower.includes('invalid url')
  ) {
    return lower.includes('only supports public github')
      ? 'unsupported provider'
      : 'invalid URL'
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('secondary rate') ||
    lower.includes('too many requests')
  ) {
    return 'rate-limited'
  }

  if (
    lower.includes('private') ||
    lower.includes('inaccessible') ||
    lower.includes('access denied') ||
    lower.includes('not found')
  ) {
    return 'private/inaccessible repo'
  }

  if (
    lower.includes('too large') ||
    lower.includes('size limit') ||
    lower.includes('max repo size') ||
    lower.includes('exceeded')
  ) {
    return 'repo too large'
  }

  if (lower.includes('unsupported') && lower.includes('github')) {
    return 'unsupported provider'
  }

  return error.message
}

export const normalizeGithubRepoUrl = (
  input: string
): { normalizedUrl?: string; error?: string } => {
  let parsed: URL

  try {
    parsed = new URL(input)
  } catch {
    return { error: 'invalid URL' }
  }

  if (parsed.hostname.toLowerCase() !== 'github.com') {
    return { error: 'unsupported provider' }
  }

  if (parsed.protocol !== 'https:') {
    return { error: 'invalid URL' }
  }

  const [owner, repoWithSuffix, ...rest] = parsed.pathname
    .split('/')
    .filter(Boolean)
  if (!owner || !repoWithSuffix || rest.length > 0) {
    return { error: 'invalid URL' }
  }

  const repo = repoWithSuffix.replace(/\.git$/iu, '')
  const valid = /^[A-Za-z0-9_.-]+$/u
  if (!repo || !valid.test(owner) || !valid.test(repo)) {
    return { error: 'invalid URL' }
  }

  return { normalizedUrl: `https://github.com/${owner}/${repo}` }
}
