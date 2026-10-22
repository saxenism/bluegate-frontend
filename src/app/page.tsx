'use client'

import Image from 'next/image'
import Link from 'next/link'
import GithubIcon from '@/assets/icons/github.svg'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { BluegateLoader } from '@/components/blugate-loader'
import { Turnstile } from '@/components/turnstile'
import { LINKS, TURNSTILE_SITE_KEY } from '@/lib/constants'
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

  if (isLoading) return <BluegateLoader message="Submitting the repository" />

  return (
    <div className="border-border container flex flex-1 flex-col items-center border font-sans">
      <main className="flex w-full flex-1 flex-col items-center justify-between gap-12 px-4 py-12 md:gap-16 md:px-16">
        <div className="space-y-8 md:space-y-10">
          <Image
            src="/logo/full.svg"
            alt="Bluegate"
            width={295}
            height={80}
            className="mx-auto h-20 w-auto select-none"
            priority
          />
          <h1 className="font-basic mx-auto max-w-180 text-center font-medium text-pretty text-[#CACACA] md:text-xl">
            Paste a suspicious repo. Bluegate tells you what it tries to run
            before you do
          </h1>
        </div>
        <form
          className="w-full max-w-209"
          onSubmit={(event) => {
            event.preventDefault()
            void runScanFlow()
          }}
        >
          <label
            htmlFor="repo-url"
            className="mb-3 block text-sm font-medium text-[#A9A9A9]"
          >
            REPOSITORY URL
          </label>
          <div className="flex">
            <div className="flex w-full min-w-0">
              <div
                className={cn(
                  'border-border grid size-14 shrink-0 place-items-center border md:size-18',
                  errorField === 'repo' && 'border-[#F07979]'
                )}
              >
                <GithubIcon aria-hidden="true" className="size-7 md:size-8" />
              </div>
              <input
                id="repo-url"
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
                aria-describedby="scan-error"
                className={cn(
                  'border-border h-14 w-full min-w-0 border-y border-r px-4 py-2.5 text-base font-medium placeholder:text-[#8F8F8F] md:h-18 md:px-6 md:py-5 md:text-lg',
                  errorField === 'repo' && 'border-[#F07979]'
                )}
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
          </div>
          <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-[#A9A9A9]">
              <label htmlFor="scan-ref" className="font-medium">
                REF
              </label>
              <span>Optional · branch, tag, or commit</span>
            </div>
            <input
              id="scan-ref"
              name="ref"
              type="text"
              maxLength={255}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              value={scanRef}
              aria-invalid={errorField === 'ref'}
              aria-describedby="ref-hint scan-error"
              className={cn(
                'border-border h-14 w-full min-w-0 border px-4 py-2.5 text-base font-medium placeholder:text-[#8F8F8F] md:px-6 md:text-lg',
                errorField === 'ref' && 'border-[#F07979]'
              )}
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
              className="mt-2 text-sm leading-relaxed text-[#A9A9A9]"
            >
              Leave empty to use the URL’s ref or the repository’s default
              branch.
            </p>
          </div>
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
            className="border-border mt-6 h-14 w-full border bg-[#FAFAFA] px-6 text-lg font-semibold text-[#1F1F1F] hover:bg-[#DEDEDE] disabled:cursor-not-allowed disabled:opacity-50 md:h-16 md:text-xl"
          >
            Analyse
          </button>
          <div
            id="scan-error"
            role="alert"
            className="mt-4 min-h-6 text-sm font-medium text-[#F07979]"
          >
            {error}
          </div>
        </form>
        <footer className="flex w-full items-center justify-between gap-4 text-base font-medium text-[#A9A9A9] max-md:flex-col lg:text-xl">
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
