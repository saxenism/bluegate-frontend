'use client'

import GithubIcon from '@/assets/icons/github.svg'
import { useRef, useState } from 'react'
import { cn } from 'cn'
import { BluegateLoader } from '@/components/blugate-loader'
import { Turnstile } from '@/components/turnstile'
import { TURNSTILE_SITE_KEY } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import {
  BluegateApiError,
  createScan,
  mapApiErrorToInlineMessage,
  normalizeGithubRepoUrl,
  scanQueryKey,
} from '@/lib/api'
import { isScanDocument } from '@/lib/types'
import { cacheReport } from '@/lib/report-cache'
import { useQueryClient } from '@tanstack/react-query'
import { SiteShell } from '@/components/site-shell'
import { SiteButton } from '@/components/ui/site-button'

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('')
  const [scanRef, setScanRef] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<'repo' | 'ref' | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [challengeAttempt, setChallengeAttempt] = useState(0)
  const submitting = useRef(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  async function runScanFlow() {
    if (submitting.current) return
    setErrorField(null)
    const { normalizedUrl, error: validationError } =
      normalizeGithubRepoUrl(repoUrl)
    if (validationError || !normalizedUrl) {
      setErrorField('repo')
      setError(validationError || 'Enter a valid repository URL.')
      return
    }
    if (TURNSTILE_SITE_KEY && !token) {
      setError('Complete the verification before starting your scan.')
      return
    }
    submitting.current = true
    setError(null)
    setIsLoading(true)
    try {
      const scan = await createScan(normalizedUrl, {
        ref: scanRef,
        turnstileToken: token ?? undefined,
      })
      if (isScanDocument(scan)) {
        queryClient.setQueryData(scanQueryKey(scan.scan_id), scan)
        cacheReport(scan.scan_id, scan)
      }
      router.push(`/report/${scan.scan_id}`)
    } catch (err) {
      setError(mapApiErrorToInlineMessage(err))
      if (err instanceof BluegateApiError) {
        if (
          ['REF_NOT_FOUND', 'INVALID_REF'].includes(err.code) ||
          (err.status === 400 && /\bref\b/iu.test(err.message))
        )
          setErrorField('ref')
        else if (
          [
            'INVALID_URL',
            'REPO_NOT_FOUND',
            'REPO_BLOCKED',
            'EMPTY_REPOSITORY',
          ].includes(err.code)
        )
          setErrorField('repo')
      }
      setToken(null)
      setChallengeAttempt((attempt) => attempt + 1)
      setIsLoading(false)
      submitting.current = false
    }
  }

  if (isLoading)
    return (
      <div className="bg-background text-foreground flex min-h-dvh flex-1 font-mono leading-normal tracking-normal">
        <BluegateLoader message="Submitting the repository" />
      </div>
    )

  return (
    <SiteShell home>
      <section
        className="border-y border-(--rule) bg-(--panel)"
        aria-labelledby="scan-title"
      >
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-(--rule) px-5 py-3">
          <h2 id="scan-title" className="font-serif text-[26px] leading-[1.2]">
            Submit a repository
          </h2>
          <span className="text-xs leading-[1.55] text-(--ink-3)">
            Public github.com
          </span>
        </header>
        <div className="px-5 py-6">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void runScanFlow()
            }}
          >
            <label
              htmlFor="repo-url"
              className="block text-sm leading-[1.55] text-(--ink)"
            >
              Repository URL
            </label>
            <div
              className={cn(
                'mt-2 flex items-stretch border border-(--control-rule) bg-(--bg)',
                errorField === 'repo' && 'border-(--error)'
              )}
            >
              <span className="grid w-14 shrink-0 place-items-center border-r border-(--rule)">
                <GithubIcon
                  aria-hidden="true"
                  className="size-6 text-(--ink)"
                />
              </span>
              <input
                id="repo-url"
                className="min-h-14 w-full min-w-0 bg-transparent px-4 py-3 text-(--ink) placeholder:text-(--ink-3) placeholder:opacity-100"
                name="repo_url"
                type="text"
                required
                maxLength={2048}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="url"
                value={repoUrl}
                aria-label="Public GitHub repository URL"
                aria-invalid={errorField === 'repo'}
                aria-describedby="repo-hint scan-error"
                placeholder="https://github.com/owner/repo"
                onChange={(event) => {
                  setRepoUrl(event.target.value)
                  if (error) {
                    setError(null)
                    setErrorField(null)
                  }
                }}
              />
            </div>
            <p
              id="repo-hint"
              className="mt-2 text-xs leading-[1.65] text-(--ink-3)"
            >
              The ref is pinned to a commit before anything is read.
            </p>
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <label
                htmlFor="scan-ref"
                className="block text-sm leading-[1.55] text-(--ink)"
              >
                Ref
              </label>
              <span className="text-xs leading-[1.55] text-(--ink-3)">
                Optional: branch, tag, or commit
              </span>
            </div>
            <input
              id="scan-ref"
              className={cn(
                'mt-2 min-h-12 w-full border border-(--control-rule) bg-(--bg) px-3.5 py-2.5 text-(--ink) placeholder:text-(--ink-3) placeholder:opacity-100',
                errorField === 'ref' && 'border-(--error)'
              )}
              name="ref"
              type="text"
              maxLength={255}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              value={scanRef}
              aria-invalid={errorField === 'ref'}
              aria-describedby="ref-hint scan-error"
              placeholder="Default branch if empty"
              onChange={(event) => {
                setScanRef(event.target.value)
                if (error) {
                  setError(null)
                  setErrorField(null)
                }
              }}
            />
            <p
              id="ref-hint"
              className="mt-2 text-xs leading-[1.65] text-(--ink-3)"
            >
              Leave empty to use the URL’s ref or the repository’s default
              branch.
            </p>
            {TURNSTILE_SITE_KEY && (
              <Turnstile
                key={challengeAttempt}
                siteKey={TURNSTILE_SITE_KEY}
                onToken={setToken}
              />
            )}
            <button
              type="submit"
              disabled={Boolean(TURNSTILE_SITE_KEY && !token)}
              className="mt-6 flex min-h-13 w-full items-center justify-center border border-(--fill) bg-(--fill) px-5 py-3 font-semibold text-(--fill-text) transition-colors duration-150 ease-out enabled:hover:bg-(--bg) enabled:hover:text-(--ink) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Scan this commit
            </button>
            <div
              id="scan-error"
              role="alert"
              className="text-sm leading-[1.55] text-(--error) not-empty:mt-4"
            >
              {error}
            </div>
          </form>
          <div className="mt-6 border-t border-(--rule) pt-5">
            <p className="mb-2.5 text-xs leading-[1.55] text-(--ink-3)">
              Fill an example URL
            </p>
            <div className="flex flex-wrap gap-2">
              {['expressjs/express', 'pallets/flask'].map((repo) => (
                <SiteButton
                  key={repo}
                  type="button"
                  onClick={() => {
                    setRepoUrl(`https://github.com/${repo}`)
                    setError(null)
                    setErrorField(null)
                    document.getElementById('repo-url')?.focus()
                  }}
                >
                  {repo}
                </SiteButton>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 border-y border-(--rule) md:grid-cols-2">
        <section aria-labelledby="coverage-title" className="px-5 py-6">
          <h2
            id="coverage-title"
            className="mb-4 font-serif text-[28px] leading-[1.1]"
          >
            What this scan covers
          </h2>
          <ul className="list-[square] pl-4.5 text-[13px] leading-[1.8] text-(--ink-2) [&_li+li]:mt-2.5">
            <li>One commit, pinned to a SHA before anything is read.</li>
            <li>
              What clone, open, install, build, and run would execute, and the
              files they load.
            </li>
            <li>
              Quoted evidence for every finding. Coverage comes before the
              verdict.
            </li>
          </ul>
        </section>
        <section
          aria-labelledby="limits-title"
          className="border-t border-(--rule) px-5 py-6 md:border-t-0 md:border-l"
        >
          <h2
            id="limits-title"
            className="mb-4 font-serif text-[28px] leading-[1.1]"
          >
            Limits worth knowing
          </h2>
          <ul className="list-[square] pl-4.5 text-[13px] leading-[1.8] text-(--ink-2) [&_li+li]:mt-2.5">
            <li>
              Public GitHub repositories only. Downloaded assets and
              dependencies can change after a scan.
            </li>
            <li>
              CLEAN means the scan finished and found nothing. It is not a
              certificate of safety.
            </li>
            <li>
              PARTIAL means something required did not run. It is not a weak
              CLEAN.
            </li>
          </ul>
        </section>
      </div>
    </SiteShell>
  )
}
