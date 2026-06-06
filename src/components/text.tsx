'use client'

import { BluegateReport } from '@/lib/types'
import GithubIcon from '@/assets/icons/github.svg'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type Props = { data: BluegateReport }

type AnyRecord = Record<string, unknown>

type FindingView = {
  id: string
  title: string
  severity: string
  confidence: string
  category: string
  file: string
  line: number | null
  evidence: string
  explanation: string
  recommendation: string
  scoreImpact: number
  triggers: string[]
}

const VERDICT_TONES: Record<
  string,
  { label: string; scoreClass: string; badgeClass: string; bannerClass: string }
> = {
  CRITICAL: {
    label: 'Critical Risk',
    scoreClass: 'text-[#E10000]',
    badgeClass: 'bg-[#3A0000] text-[#FF4D4D]',
    bannerClass: 'bg-[#2B0000] text-[#FF4D4D]',
  },
  HIGH: {
    label: 'High Risk',
    scoreClass: 'text-[#E10000]',
    badgeClass: 'bg-[#3A0000] text-[#FF4D4D]',
    bannerClass: 'bg-[#2B0000] text-[#FF4D4D]',
  },
  MEDIUM: {
    label: 'Suspicious',
    scoreClass: 'text-[#B47C11]',
    badgeClass: 'bg-[#3A2900] text-[#E7B74F]',
    bannerClass: 'bg-[#2B1D00] text-[#E7B74F]',
  },
  GUARDED: {
    label: 'Guarded',
    scoreClass: 'text-[#8A8A8A]',
    badgeClass: 'bg-[#1A1A1A] text-[#8F8F8F]',
    bannerClass: 'bg-[#161616] text-[#8F8F8F]',
  },
  LOW: {
    label: 'Low Risk',
    scoreClass: 'text-[#0ECF7A]',
    badgeClass: 'bg-[#00361F] text-[#25DA8C]',
    bannerClass: 'bg-[#022819] text-[#25DA8C]',
  },
  UNKNOWN: {
    label: 'Unknown',
    scoreClass: 'text-[#8A8A8A]',
    badgeClass: 'bg-[#1A1A1A] text-[#8F8F8F]',
    bannerClass: 'bg-[#161616] text-[#8F8F8F]',
  },
}

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: 'bg-[#6B0000]',
  HIGH: 'bg-[#5A0000]',
  MEDIUM: 'bg-[#53410A]',
  LOW: 'bg-[#094529]',
}

const sanitize = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const toFindings = (rawFindings: Array<Record<string, unknown>>) =>
  rawFindings.map((item, index) => {
    const triggerRaw = Array.isArray(item.execution_paths)
      ? item.execution_paths
      : []

    return {
      id: sanitize(item.id, `finding-${index + 1}`),
      title: sanitize(item.title, 'Untitled finding'),
      severity: sanitize(item.severity, 'UNKNOWN').toUpperCase(),
      confidence: sanitize(item.confidence, 'LOW'),
      category: sanitize(item.category, 'uncategorized'),
      file: sanitize(item.file, 'unknown'),
      line:
        typeof item.line === 'number' && Number.isFinite(item.line)
          ? item.line
          : null,
      evidence: sanitize(item.evidence, 'No evidence provided.'),
      explanation: sanitize(item.explanation, 'No explanation provided.'),
      recommendation: sanitize(
        item.recommendation,
        'No recommendation provided.'
      ),
      scoreImpact: toNumber(item.score_impact, 0),
      triggers: triggerRaw
        .map((path) => sanitize(path))
        .filter((path) => path.length > 0),
    }
  }) as FindingView[]

const toneFor = (level: string) => VERDICT_TONES[level] ?? VERDICT_TONES.UNKNOWN

const formatDate = (iso: string) => {
  if (!iso) return '-'
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return '-'

  return value
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    .replace(',', ',')
}

const formatTrigger = (value: string) =>
  value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export const Report = ({ data }: Props) => {
  const [expandedIndex, setExpandedIndex] = useState(0)

  const findings = useMemo(() => toFindings(data.findings), [data.findings])
  const topFinding = findings[expandedIndex] ?? null

  const verdictLevel = sanitize(data.verdict.level, 'UNKNOWN').toUpperCase()
  const verdictTone = toneFor(verdictLevel)
  const score = data.verdict.bluegate_score
  const scoreValue = typeof score === 'number' ? score : null
  const filledBars =
    scoreValue === null
      ? 0
      : Math.max(0, Math.min(25, Math.round(scoreValue / 4)))
  const confidencePct = Math.max(
    0,
    Math.min(100, Math.round(toNumber(data.verdict.scan_confidence, 0)))
  )

  const topPath =
    (data.execution_paths?.[0] as unknown as AnyRecord | undefined) ?? null
  const topPathLabel = topPath
    ? sanitize(topPath.label, 'Unknown')
    : 'Coverage was limited'
  const topPathSummary = topPath
    ? sanitize(topPath.summary, 'No execution-path summary available.')
    : 'Bluegate could not inspect enough execution paths to conclude risk.'
  const topPathRisk = topPath
    ? sanitize(topPath.risk, 'UNKNOWN').toUpperCase()
    : 'UNKNOWN'

  const scoreDrops = ((data.score_drops ?? []) as AnyRecord[])
    .map((item) => ({
      title: sanitize(item.title, 'Unlabeled score change'),
      scoreImpact: toNumber(item.score_impact, 0),
      evidence: sanitize(item.evidence, ''),
      severity: sanitize(item.severity, 'UNKNOWN').toUpperCase(),
    }))
    .filter((item) => item.scoreImpact !== 0)
    .slice(0, 6)

  const executionCards = (data.execution_paths as unknown as AnyRecord[]).slice(
    0,
    4
  )

  const dependencyRisks = (
    (data.dependencies?.risky_packages ?? []) as AnyRecord[]
  )
    .map((item, index) => ({
      id: sanitize(item.id, `dependency-${index + 1}`),
      title: sanitize(item.title, 'Unlabeled dependency risk'),
      severity: sanitize(item.severity, 'UNKNOWN').toUpperCase(),
      evidence: sanitize(item.evidence, ''),
    }))
    .slice(0, 4)

  const networkSignals = (data.network_indicators ?? [])
    .map((item, index) => ({
      id: `${item.value}-${index}`,
      value: sanitize(item.value, 'Unknown indicator'),
      risk: sanitize(item.risk, 'UNKNOWN').toUpperCase(),
      context: sanitize(item.context, 'No context'),
    }))
    .slice(0, 4)

  const credentialSignals = findings
    .filter((item) => {
      const file = item.file.toLowerCase()
      const title = item.title.toLowerCase()
      return (
        item.category === 'wallet-theft' ||
        item.category === 'browser-theft' ||
        item.category === 'cloud-secret' ||
        file.includes('.ssh') ||
        file.includes('.aws') ||
        title.includes('wallet') ||
        title.includes('metamask') ||
        title.includes('credential')
      )
    })
    .slice(0, 3)

  const readmeSignals = findings
    .filter((item) => {
      const file = item.file.toLowerCase()
      return item.category === 'social-engineering' || file.includes('readme')
    })
    .slice(0, 3)

  const shortCommit = sanitize(data.repo.commit).slice(0, 7)
  const repoHost = sanitize(data.repo.url, '').replace(/^https?:\/\//, '')

  return (
    <section className="border-border mb-12 w-full border-y">
      <div className="border-border border-b px-4 py-6 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <GithubIcon className="h-7 w-7 shrink-0 text-[#EBEBEB]" />
            <div className="min-w-0">
              {data.repo.url ? (
                <Link
                  href={data.repo.url}
                  target="_blank"
                  className="block truncate text-lg font-semibold text-[#EBEBEB] hover:underline"
                >
                  {repoHost}
                </Link>
              ) : (
                <div className="text-lg font-semibold text-[#EBEBEB]">
                  Unknown repo
                </div>
              )}

              <div className="mt-2 text-xs tracking-wide text-[#8A8A8A] uppercase">
                Commit: {shortCommit || '-'}
                <span className="mx-2">|</span>
                Scanned: {formatDate(sanitize(data.repo.scanned_at))}
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 overflow-hidden border border-[#1E1E1E] text-xs text-[#9A9A9A]">
            <button className="border-r border-[#1E1E1E] px-4 py-2 hover:bg-[#101010]">
              Download JSON
            </button>
            <button className="px-4 py-2 hover:bg-[#101010]">Copy Link</button>
          </div>
        </div>
      </div>

      <div className="border-border grid border-b md:grid-cols-3">
        <div className="border-border border-r p-4 md:p-6">
          <div className="mb-3 text-xs tracking-wide text-[#888] uppercase">
            Bluegate Score
          </div>
          <div className="flex items-start gap-2">
            <div className={`text-6xl leading-none ${verdictTone.scoreClass}`}>
              {scoreValue ?? '--'}
            </div>
            <div className="pt-6 text-xl text-[#CFCFCF]">of 100</div>
          </div>
        </div>

        <div className="border-border border-r p-4 md:p-6">
          <div className="mb-3 text-xs tracking-wide text-[#888] uppercase">
            Scan Confidence
          </div>
          <div className="text-6xl leading-none text-[#E9E9E9]">
            {sanitize(data.verdict.scan_confidence_band, 'low')
              .toLowerCase()
              .replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 w-full bg-[#1A1A1A]">
              <div
                className="h-full bg-[#6E6E6E]"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <div className="text-xs text-[#999]">{confidencePct}%</div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="text-xs tracking-wide text-[#888] uppercase">
              Top Execution Path
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium ${toneFor(topPathRisk).badgeClass}`}
            >
              {toneFor(topPathRisk).label}
            </span>
          </div>
          <div className="text-lg font-semibold text-[#E6E6E6]">
            {topPathLabel}
          </div>
          <div className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">
            {topPathSummary}
          </div>
        </div>
      </div>

      <div className="border-border border-b p-8">
        <div
          className={`mb-3 text-2xl font-semibold ${verdictTone.scoreClass}`}
        >
          {sanitize(data.verdict.summary, 'Do not treat this score as safe.')}
        </div>
        <div className="text-sm leading-relaxed text-[#9C9C9C]">
          {sanitize(
            data.verdict.recommendation,
            'Inspect this repository only in a disposable VM without secrets.'
          )}
        </div>
      </div>

      <div className="border-border border-b p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-xs tracking-wide text-[#8F8F8F] uppercase">
            Score Breakdown
          </div>
          <span
            className={`px-3 py-1 text-xs font-medium ${verdictTone.badgeClass}`}
          >
            {verdictTone.label}
          </span>
        </div>

        <div className="flex items-end gap-2">
          <div className={`text-6xl leading-none ${verdictTone.scoreClass}`}>
            {scoreValue ?? '--'}
          </div>
          <div className="pb-2 text-xl text-[#BFBFBF]">of 100</div>
        </div>

        <div className="mt-6 grid grid-cols-25 gap-2">
          {Array.from({ length: 25 }).map((_, index) => (
            <div
              key={`score-bar-${index}`}
              className={`h-12 border border-[#4F4F4F] ${
                index < filledBars ? 'bg-[#9A9A9A]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(scoreDrops.length > 0
            ? scoreDrops
            : [
                {
                  title: 'No scored findings to display',
                  scoreImpact: 0,
                  evidence:
                    'Bluegate did not return score-impact events for this scan.',
                  severity: 'UNKNOWN',
                },
              ]
          ).map((drop, index) => (
            <div
              key={`${drop.title}-${index}`}
              className="flex items-start gap-4"
            >
              <div
                className={`min-w-16 px-3 py-2 text-right text-3xl leading-none text-[#E0E0E0] ${
                  IMPACT_COLORS[drop.severity] ?? 'bg-[#1D1D1D]'
                }`}
              >
                {drop.scoreImpact > 0
                  ? `+${drop.scoreImpact}`
                  : drop.scoreImpact}
              </div>
              <div>
                <div className="text-base font-semibold text-[#E7E7E7]">
                  {drop.title}
                </div>
                <div className="mt-1 text-xs text-[#888]">
                  {drop.evidence || 'No evidence provided.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border border-b p-8">
        <div className="mb-6 text-xs tracking-wide text-[#8F8F8F] uppercase">
          Execution Paths · by User Action
        </div>

        <div className="grid gap-0 border border-[#1E1E1E] md:grid-cols-2">
          {(executionCards.length > 0
            ? executionCards
            : [
                {
                  label: 'Coverage was limited',
                  risk: 'UNKNOWN',
                  summary: 'No execution paths available in this report.',
                  commands: [],
                },
              ]
          ).map((path, index) => {
            const risk = toneFor(sanitize(path.risk, 'UNKNOWN').toUpperCase())
            const commands = Array.isArray(path.commands)
              ? path.commands.filter(
                  (command): command is string => typeof command === 'string'
                )
              : []

            return (
              <div
                key={`${sanitize(path.label, 'path')}-${index}`}
                className="border-r border-b border-[#1E1E1E] p-6 md:min-h-40"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="text-lg font-semibold text-[#E7E7E7]">
                    {sanitize(path.label, 'Unknown path')}
                  </div>
                  <span className={`px-3 py-1 text-xs ${risk.badgeClass}`}>
                    {risk.label}
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-[#8B8B8B]">
                  {(commands.length > 0
                    ? commands
                    : [sanitize(path.summary, 'No command evidence available.')]
                  ).map((item) => (
                    <li
                      key={`${sanitize(path.label)}-${item}`}
                      className="truncate"
                    >
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-border border-b p-8">
        <div className="mb-6 text-xs tracking-wide text-[#8F8F8F] uppercase">
          Findings
        </div>

        {topFinding ? (
          <>
            <div className="border border-[#1E1E1E] p-6">
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-dashed border-[#2C2C2C] pb-4">
                <div>
                  <div className="text-lg font-semibold text-[#EBEBEB]">
                    {topFinding.title}
                  </div>
                  <div className="mt-1 text-xs text-[#8F8F8F]">
                    {topFinding.file}
                    {topFinding.line ? `, line ${topFinding.line}` : ''}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 text-xs ${toneFor(topFinding.severity).badgeClass}`}
                >
                  {toneFor(topFinding.severity).label}
                </span>
              </div>

              <div className="grid gap-2 text-xs text-[#8F8F8F] md:grid-cols-4">
                <div>Severity: {topFinding.severity}</div>
                <div>Confidence: {topFinding.confidence}</div>
                <div>Score Impact: {topFinding.scoreImpact}</div>
                <div>
                  Triggered By:{' '}
                  {topFinding.triggers.length > 0
                    ? topFinding.triggers.map(formatTrigger).join(', ')
                    : 'Unknown'}
                </div>
              </div>

              <div className="mt-6 text-xs tracking-wide text-[#8D8D8D] uppercase">
                Evidence
              </div>
              <pre className="mt-2 overflow-x-auto border border-[#1F1F1F] bg-[#101010] p-4 text-xs leading-relaxed text-[#C8C8C8]">
                {topFinding.evidence}
              </pre>

              <div className="mt-6 text-xs tracking-wide text-[#8D8D8D] uppercase">
                Why It Matters
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#B4B4B4]">
                {topFinding.explanation}
              </p>

              <div className="mt-6 text-xs tracking-wide text-[#8D8D8D] uppercase">
                Recommendation
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#B4B4B4]">
                {topFinding.recommendation}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {findings.slice(0, 8).map((finding, index) => (
                <button
                  key={finding.id}
                  onClick={() => setExpandedIndex(index)}
                  className={`flex w-full items-center justify-between border px-4 py-3 text-left hover:bg-[#101010] ${
                    expandedIndex === index
                      ? 'border-[#313131] bg-[#101010]'
                      : 'border-[#1E1E1E]'
                  }`}
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-[#D8D8D8]">
                    {finding.title}
                  </span>
                  <span
                    className={`ml-4 shrink-0 px-2 py-1 text-xs ${toneFor(finding.severity).badgeClass}`}
                  >
                    {toneFor(finding.severity).label}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="border border-[#1E1E1E] p-10 text-center">
            <div className="text-2xl font-semibold text-[#EBEBEB]">
              No findings worth surfacing.
            </div>
            <div className="mt-2 text-sm text-[#8D8D8D]">
              Bluegate matched none of its detection rules above the surfacing
              threshold.
            </div>
          </div>
        )}
      </div>

      <div className="border-border border-b p-8">
        <div className="mb-6 text-xs tracking-wide text-[#8F8F8F] uppercase">
          Execution Paths · by User Action
        </div>

        <div className="grid gap-0 border border-[#1E1E1E] md:grid-cols-2">
          <div className="border-r border-[#1E1E1E] p-6">
            <div className="mb-4 text-xs tracking-wide text-[#8A8A8A] uppercase">
              Dependency Risks
            </div>

            <div className="space-y-4">
              {(dependencyRisks.length > 0
                ? dependencyRisks
                : [
                    {
                      id: 'dep-none',
                      title: 'No dependency risks surfaced',
                      severity: 'LOW',
                      evidence: 'Bluegate did not flag direct dependencies.',
                    },
                  ]
              ).map((risk) => (
                <div
                  key={risk.id}
                  className="grid grid-cols-[1fr_auto] gap-3 border-t border-[#1A1A1A] pt-3 first:border-0 first:pt-0"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#E7E7E7]">
                      {risk.title}
                    </div>
                    <div className="mt-1 text-xs text-[#8D8D8D]">
                      {risk.evidence}
                    </div>
                  </div>
                  <span
                    className={`h-fit px-2 py-1 text-xs ${toneFor(risk.severity).badgeClass}`}
                  >
                    {toneFor(risk.severity).label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 text-xs tracking-wide text-[#8A8A8A] uppercase">
              Suspicious URLs & Domains
            </div>

            <div className="space-y-4">
              {(networkSignals.length > 0
                ? networkSignals
                : [
                    {
                      id: 'url-none',
                      value: 'No suspicious network indicators',
                      risk: 'LOW',
                      context: 'No URL or domain indicators were flagged.',
                    },
                  ]
              ).map((signal) => (
                <div
                  key={signal.id}
                  className="grid grid-cols-[1fr_auto] gap-3 border-t border-[#1A1A1A] pt-3 first:border-0 first:pt-0"
                >
                  <div>
                    <div className="truncate text-sm font-semibold text-[#E7E7E7]">
                      {signal.value}
                    </div>
                    <div className="mt-1 text-xs text-[#8D8D8D]">
                      {signal.context}
                    </div>
                  </div>
                  <span
                    className={`h-fit px-2 py-1 text-xs ${toneFor(signal.risk).badgeClass}`}
                  >
                    {toneFor(signal.risk).label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-border border-b p-8">
        <div className="mb-6 text-xs tracking-wide text-[#8F8F8F] uppercase">
          Credential & Social-Engineering Signals
        </div>

        <div className="grid gap-0 border border-[#1E1E1E] md:grid-cols-2">
          <div className="border-r border-[#1E1E1E] p-6">
            <div className="mb-4 text-xs tracking-wide text-[#8A8A8A] uppercase">
              Credential Path References
            </div>

            <div className="space-y-4">
              {(credentialSignals.length > 0
                ? credentialSignals
                : [
                    {
                      id: 'credential-none',
                      title: 'No credential references found',
                      severity: 'LOW',
                      evidence:
                        'Bluegate did not detect SSH, AWS, browser-profile, or wallet paths.',
                    },
                  ]
              ).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] gap-3 border-t border-[#1A1A1A] pt-3 first:border-0 first:pt-0"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#E7E7E7]">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs text-[#8D8D8D]">
                      {item.evidence}
                    </div>
                  </div>
                  <span
                    className={`h-fit px-2 py-1 text-xs ${toneFor(item.severity).badgeClass}`}
                  >
                    {toneFor(item.severity).label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 text-xs tracking-wide text-[#8A8A8A] uppercase">
              README Signals
            </div>

            <div className="space-y-4">
              {(readmeSignals.length > 0
                ? readmeSignals
                : [
                    {
                      id: 'readme-none',
                      title: 'README looks normal',
                      severity: 'LOW',
                      evidence:
                        'No pressure language, trust-workspace asks, or live-credential requests detected.',
                    },
                  ]
              ).map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] gap-3 border-t border-[#1A1A1A] pt-3 first:border-0 first:pt-0"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#E7E7E7]">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs text-[#8D8D8D]">
                      {item.evidence}
                    </div>
                  </div>
                  <span
                    className={`h-fit px-2 py-1 text-xs ${toneFor(item.severity).badgeClass}`}
                  >
                    {toneFor(item.severity).label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 text-base">
        <div className="font-basic pb-8 text-[#8F8F8F]">Limitations</div>

        <ul className="space-y-4 text-[#8F8F8F]">
          {data.limitations.map((limitation, index) => (
            <li
              key={limitation}
              className="leading-[160%] font-semibold text-[#A9A9A9]"
            >
              <span className="mr-4 text-[#EBEBEB]">
                {(index + 1).toString().padStart(2, '0')}{' '}
              </span>
              {limitation}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
