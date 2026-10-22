'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import GithubIcon from '@/assets/icons/github.svg'
import DownloadIcon from '@/assets/icons/download.svg'
import LinkIcon from '@/assets/icons/link.svg'
import CheckIcon from '@/assets/icons/check.svg'
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover'
import { Progress } from './ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { downloadScanReport, mapApiErrorToInlineMessage } from '@/lib/api'
import {
  getBreakdownNotes,
  getRecommendation,
  getReportView,
  humanize,
  isExpired,
  recordSummary,
  severity,
  text,
} from '@/lib/report'
import {
  type Finding,
  type ReportFormat,
  type ScanDocument,
  type Severity,
  type SurfaceEntry,
  type Verdict,
} from '@/lib/types'
import { cn } from '@/lib/utils/cn'

type Tone = Verdict | Severity | 'unknown' | 'failed'
const COLORS: Record<Tone, string> = {
  clean: '#56C58A',
  suspicious: '#F6A84B',
  malicious: '#F07979',
  partial: '#F6C76A',
  critical: '#F07979',
  high: '#F59B8F',
  medium: '#F6C76A',
  low: '#93C5A8',
  info: '#A0B6CF',
  unknown: '#A9A9A9',
  failed: '#F07979',
}
const FORMATS: { value: ReportFormat; label: string; extension: string }[] = [
  { value: 'json', label: 'Download JSON', extension: 'json' },
  { value: 'text', label: 'Download plain text', extension: 'txt' },
  { value: 'agent', label: 'Download agent report', extension: 'agent.txt' },
]
const SECTION_TITLE = 'font-basic mb-8 text-base font-medium text-[#A9A9A9]'

export function Report({
  data,
  scanId,
}: {
  data: ScanDocument
  scanId: string
}) {
  const view = getReportView(data)
  const verdict: Tone =
    data.status === 'failed' ? 'failed' : data.verdict || 'unknown'
  const score = data.score
  const surface = data.surface ?? []
  const unattended = surface.filter(
    (entry) => entry.gate === 'none' && entry.tier !== 'unreached'
  ).length
  const [copied, setCopied] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  async function copyLink() {
    setActionError(null)
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      timers.current.push(setTimeout(() => setCopied(false), 2000))
    } catch {
      setActionError(
        'Could not copy the link. Copy the address from your browser instead.'
      )
    }
  }

  async function download(format: ReportFormat) {
    if (downloading) return
    setActionError(null)
    setDownloading(true)
    try {
      const blob = await downloadScanReport(scanId, format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bluegate-report-${scanId}.${FORMATS.find((item) => item.value === format)?.extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      timers.current.push(setTimeout(() => URL.revokeObjectURL(url), 1000))
      setDownloadOpen(false)
      setDownloaded(true)
      timers.current.push(setTimeout(() => setDownloaded(false), 2000))
    } catch (error) {
      setActionError(mapApiErrorToInlineMessage(error))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section
      aria-label="Scan report"
      className="border-border mb-12 w-full min-w-0 border-y wrap-anywhere"
    >
      <div className="border-border flex items-start justify-between border-b max-lg:flex-col-reverse lg:gap-4">
        <div className="flex min-w-0 gap-6 p-4 lg:p-8">
          <GithubIcon
            aria-hidden="true"
            className="size-8 shrink-0 lg:size-10"
          />
          <div className="min-w-0 space-y-4">
            <h1 className="font-basic text-xl font-semibold lg:text-2xl">
              {data.input.repo || 'Repository not reported'}
            </h1>
            <div className="font-basic flex flex-wrap gap-x-8 gap-y-1 text-sm text-[#A9A9A9]">
              <p>
                COMMIT:{' '}
                <span
                  className="font-semibold"
                  title={data.input.commit || undefined}
                >
                  {data.input.commit?.slice(0, 12) || 'Not reported'}
                </span>
              </p>
              {data.input.ref && (
                <p>
                  REF: <span className="font-semibold">{data.input.ref}</span>
                </p>
              )}
              <p>
                UPDATED: <ReportDate value={data.updated_at} />
              </p>
            </div>
          </div>
        </div>
        <div className="border-border flex border-b text-[#A9A9A9] max-lg:self-end">
          <Popover open={downloadOpen} onOpenChange={setDownloadOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={
                  downloaded ? 'Report downloaded' : 'Download report'
                }
                className="border-border grid size-16 place-items-center border-l hover:bg-[#1F1F1F] lg:size-18"
              >
                {downloaded ? (
                  <CheckIcon className="size-6" />
                ) : (
                  <DownloadIcon className="size-6" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <PopoverTitle className="sr-only">Download report</PopoverTitle>
              {FORMATS.map((format) => (
                <button
                  key={format.value}
                  type="button"
                  disabled={downloading}
                  onClick={() => void download(format.value)}
                  className="px-8 py-4 text-left text-base hover:bg-[#1F1F1F] disabled:opacity-50"
                >
                  {downloading ? 'Preparing download…' : format.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <button
            type="button"
            aria-label={copied ? 'Report link copied' : 'Copy report link'}
            onClick={() => void copyLink()}
            className="border-border grid size-16 place-items-center border-l hover:bg-[#1F1F1F] lg:size-18"
          >
            {copied ? (
              <CheckIcon className="size-6" />
            ) : (
              <LinkIcon className="size-6" />
            )}
          </button>
        </div>
      </div>
      <p role="status" className="sr-only">
        {copied
          ? 'Report link copied.'
          : downloaded
            ? 'Report downloaded.'
            : ''}
      </p>
      {actionError && (
        <p
          role="alert"
          className="border-border border-b p-4 text-[#F07979] lg:px-8"
        >
          {actionError}
        </p>
      )}
      {isExpired(data) && (
        <p className="border-border border-b p-4 text-sm text-[#F6C76A] lg:px-8">
          This is a historical result for the commit shown. Its cache validity
          has expired; start a new scan for a current assessment.
        </p>
      )}

      <div className="border-border grid grid-cols-1 border-b lg:grid-cols-3">
        <div className="relative min-w-0 p-8">
          <Badge tone={verdict} className="mb-6">
            {verdict === 'unknown' ? 'No verdict' : verdict}
          </Badge>
          <h2 className={cn(SECTION_TITLE, 'mb-2')}>RISK SCORE</h2>
          <p className="font-serif text-2xl">
            <span className="mr-4 text-8xl" style={{ color: COLORS[verdict] }}>
              {score ?? '—'}
            </span>
            {score != null && 'of 100'}
          </p>
          <p className="font-basic mt-3 text-sm text-[#A9A9A9]">
            {score == null
              ? 'The scanner did not produce a score.'
              : 'Higher scores indicate greater risk.'}
          </p>
        </div>
        <div className="border-border min-w-0 border-t p-8 lg:border-t-0 lg:border-l">
          <h2 className={SECTION_TITLE}>ANALYSIS COVERAGE</h2>
          <p className="mb-6 font-serif text-5xl">
            {data.complete ? 'Complete' : 'Incomplete'}
          </p>
          {view.required.length ? (
            <>
              <p className="font-basic mb-2 text-sm text-[#A9A9A9]">
                {view.completed} of {view.required.length} required stages
                completed
              </p>
              <Progress
                value={(view.completed / view.required.length) * 100}
                aria-label="Required stages completed"
                aria-valuetext={`${view.completed} of ${view.required.length}`}
              />
            </>
          ) : (
            <p className="font-basic text-sm text-[#A9A9A9]">
              Stage completion was not reported.
            </p>
          )}
          <a
            href="#coverage"
            className="mt-5 inline-block text-sm underline underline-offset-4 hover:text-white"
          >
            View stages and gaps
          </a>
        </div>
        <div className="border-border min-w-0 border-t p-8 lg:border-t-0 lg:border-l">
          <h2 className={SECTION_TITLE}>EXECUTION SURFACE</h2>
          <p className="mb-3 font-serif text-5xl">
            {data.surface == null
              ? 'Not reported'
              : `${surface.length} ${surface.length === 1 ? 'entry' : 'entries'}`}
          </p>
          <p className="font-basic text-sm text-[#A9A9A9]">
            {surface.length
              ? `${unattended} ${unattended === 1 ? 'entry has' : 'entries have'} no prompt or user gate. Entries are listed whether or not they are suspicious.`
              : 'Triggers and commands appear here when execution mapping is available.'}
          </p>
        </div>
      </div>

      <div
        className="border-border space-y-3 border-b p-6 lg:p-8"
        style={{ backgroundColor: `${COLORS[verdict]}0D` }}
      >
        <h2
          className="text-xl font-semibold"
          style={{ color: COLORS[verdict] }}
        >
          {data.verdict_reason ||
            (data.status === 'failed'
              ? 'This scan did not finish.'
              : 'No verdict reason was reported.')}
        </h2>
        <p className="font-basic max-w-5xl text-base text-[#CACACA]">
          {getRecommendation(data)}
        </p>
        {data.static_verdict && data.static_verdict !== data.verdict && (
          <p className="font-basic text-sm text-[#A9A9A9]">
            Static verdict: {data.static_verdict.toUpperCase()}. The final
            verdict also accounts for analysis coverage and later stages.
          </p>
        )}
      </div>

      <div
        id="coverage"
        className="border-border scroll-mt-8 border-b p-6 lg:p-8"
      >
        <h2 className={SECTION_TITLE}>STAGES & COVERAGE GAPS</h2>
        {view.stages.length ? (
          <div className="mb-6 flex flex-wrap gap-3">
            {view.stages.map((stage, index) => (
              <div
                key={`${stage.name}-${index}`}
                className="border-border border px-4 py-3 text-sm"
              >
                <p className="font-semibold capitalize">
                  {humanize(stage.name)}
                </p>
                <p
                  className="mt-1"
                  style={{
                    color:
                      stage.status === 'ok' ? COLORS.clean : COLORS.partial,
                  }}
                >
                  {humanize(stage.status)}
                  {stage.required && ' · required'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-basic mb-6 text-[#A9A9A9]">
            Stage details are unavailable.
          </p>
        )}
        <p className="font-basic mb-6 text-sm text-[#A9A9A9]">
          Detonated tiers:{' '}
          {data.coverage?.tiers_detonated?.length
            ? data.coverage.tiers_detonated.join(', ')
            : 'None reported'}
        </p>
        {view.coverage.length ? (
          <div className="space-y-6">
            {view.coverage.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-base font-semibold">{group.label}</h3>
                <ExpandableList
                  items={group.items}
                  renderItem={(item, index) => (
                    <li
                      key={`${index}-${item}`}
                      className="font-basic py-1 text-sm text-[#CACACA]"
                    >
                      {item}
                    </li>
                  )}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="font-basic text-[#A9A9A9]">
            {data.complete
              ? 'No coverage gaps were listed.'
              : 'This analysis is incomplete. The scanner did not list the missing coverage.'}
          </p>
        )}
        {data.listing?.truncated && (
          <p className="font-basic mt-6 text-[#F6C76A]">
            This report contains a limited selection of findings or execution
            entries. The score uses the full analysis. Expanding a list shows
            all entries included in this document.
          </p>
        )}
      </div>

      <div className="border-border border-b p-6 lg:p-8">
        <h2 className={SECTION_TITLE}>SCORE BREAKDOWN</h2>
        {score != null && (
          <div
            role="img"
            aria-label={`Risk score ${score} out of 100`}
            className="mb-8 flex gap-1.5 lg:gap-3"
          >
            {Array.from({ length: 25 }, (_, index) => (
              <div
                key={index}
                className="h-12 min-w-0 flex-1 border lg:h-18"
                style={{
                  borderColor:
                    index < Math.round(score / 4) ? COLORS[verdict] : '#454545',
                  backgroundColor:
                    index < Math.round(score / 4)
                      ? `${COLORS[verdict]}66`
                      : 'transparent',
                }}
              />
            ))}
          </div>
        )}
        {view.components.length ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {view.components.map((component) => (
              <div
                key={component.id}
                className="flex min-w-0 items-start gap-4"
              >
                <p
                  className="shrink-0 font-serif text-4xl"
                  style={{ color: COLORS[component.severity] }}
                >
                  {component.points == null ? '—' : `+${component.points}`}
                </p>
                <div className="min-w-0">
                  <p className="font-basic font-semibold">
                    {component.title || component.rule}
                  </p>
                  <p className="font-basic text-sm text-[#A9A9A9]">
                    {component.rule} · {component.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>
            {score == null
              ? 'A score breakdown is unavailable.'
              : 'No scoring components were listed.'}
          </EmptyState>
        )}
        {getBreakdownNotes(data.breakdown).map((note) => (
          <p key={note} className="font-basic mt-5 text-sm text-[#A9A9A9]">
            {note}
          </p>
        ))}
        <p className="font-basic mt-6 text-sm text-[#A9A9A9]">
          Scores reflect the findings, execution tiers, and scoring caps. The
          final verdict can also reflect incomplete coverage or later analysis.
        </p>
      </div>

      <div className="border-border border-b p-6 lg:p-8">
        <h2 className={SECTION_TITLE}>EXECUTION PATHS · BY USER ACTION</h2>
        <ListingNote
          listed={surface.length}
          total={data.listing?.surface?.total}
        />
        {surface.length ? (
          <ExpandableList
            items={surface}
            className="grid grid-cols-1 lg:grid-cols-2"
            renderItem={(entry, index) => (
              <SurfaceCard
                key={entry.id || `${entry.file}-${index}`}
                entry={entry}
              />
            )}
          />
        ) : (
          <EmptyState>
            {data.surface == null
              ? 'Execution mapping is unavailable.'
              : 'No execution entries were listed.'}
          </EmptyState>
        )}
      </div>

      <div className="border-border border-b p-6 lg:p-8">
        <h2 className={SECTION_TITLE}>FINDINGS</h2>
        <ListingNote
          listed={view.findings.length}
          total={data.listing?.findings?.total}
        />
        {view.findings.length ? (
          <ExpandableList
            items={view.findings}
            renderItem={(finding, index) => (
              <li
                key={`${finding.rule_id}-${finding.file}-${finding.line}-${index}`}
              >
                <FindingDetails finding={finding} index={index} />
              </li>
            )}
          />
        ) : (
          <EmptyState>
            {data.findings == null
              ? 'Findings are unavailable for this scan.'
              : view.incomplete
                ? 'No findings were listed. Analysis is incomplete; review the coverage gaps above.'
                : 'No findings were listed for this commit.'}
          </EmptyState>
        )}
      </div>

      <div className="border-border grid grid-cols-1 border-b lg:grid-cols-2">
        <SignalPanel
          title="DEPENDENCY FINDINGS"
          findings={view.dependencies}
          incomplete={view.incomplete}
        />
        <SignalPanel
          title="URLS & NETWORK SIGNALS"
          findings={view.network}
          incomplete={view.incomplete}
          className="lg:border-l"
        />
        <SignalPanel
          title="CREDENTIAL & WALLET SIGNALS"
          findings={view.credentials}
          incomplete={view.incomplete}
        />
        <SignalPanel
          title="README & AGENT SIGNALS"
          findings={view.readme}
          incomplete={view.incomplete}
          className="lg:border-l"
        />
      </div>
      {data.dependencies?.use_time_resolution && (
        <p className="border-border font-basic border-b p-6 text-sm text-[#F6C76A] lg:p-8">
          Some dependencies are resolved when the repository is used and can
          change after this scan.
          {data.dependencies.resolved_at && (
            <>
              {' '}
              Resolution recorded{' '}
              <ReportDate value={data.dependencies.resolved_at} />.
            </>
          )}
        </p>
      )}
      {Boolean(data.input.submodules.length) && (
        <div className="border-border border-b p-6 lg:p-8">
          <h2 className={SECTION_TITLE}>SUBMODULES</h2>
          <ExpandableList
            items={data.input.submodules}
            renderItem={(item, index) => (
              <li
                key={index}
                className="font-basic py-2 text-sm text-[#CACACA]"
              >
                {recordSummary(item) || 'Submodule details unavailable'}
              </li>
            )}
          />
        </div>
      )}
      {data.clone_command && (
        <div className="border-border border-b p-6 lg:p-8">
          <h2 className={SECTION_TITLE}>THE SCANNED COMMIT</h2>
          <p className="font-basic mb-4 text-sm text-[#A9A9A9]">
            The branch may have moved since this scan. This command identifies
            the commit that was analysed.
          </p>
          <CodeBlock>{data.clone_command}</CodeBlock>
        </div>
      )}
      <div className="font-basic space-y-2 p-6 text-sm text-[#A9A9A9] lg:p-8">
        <p>Scan {scanId}</p>
        {data.analyzer.version && (
          <p>
            Analyzer {data.analyzer.version}
            {data.analyzer.build_id ? ` · ${data.analyzer.build_id}` : ''}
          </p>
        )}
        {data.valid_until && (
          <p>
            Cache valid until <ReportDate value={data.valid_until} />
          </p>
        )}
      </div>
    </section>
  )
}

function Badge({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: ReactNode
  className?: string
}) {
  const color = COLORS[tone] || COLORS.unknown
  return (
    <span
      className={cn(
        'inline-block px-3 py-1.5 text-sm font-semibold uppercase',
        className
      )}
      style={{ color, backgroundColor: `${color}18` }}
    >
      {children}
    </span>
  )
}

function ReportDate({ value }: { value: string }) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return <span>Not reported</span>
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(date)}{' '}
      UTC
    </time>
  )
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="border-border max-w-full overflow-x-auto border bg-[#111111] p-4 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
      <code>{children}</code>
    </pre>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="border-border font-basic border p-6 text-base text-[#A9A9A9]">
      {children}
    </p>
  )
}

function ListingNote({
  listed,
  total,
}: {
  listed: number
  total?: number | null
}) {
  if (total == null || total <= listed) return null
  return (
    <p className="font-basic mb-4 text-sm text-[#F6C76A]">
      Showing {listed} of {total} entries. The API omitted the remaining entries
      from this document.
    </p>
  )
}

function ExpandableList<T>({
  items,
  renderItem,
  className,
}: {
  items: readonly T[]
  renderItem: (item: T, index: number) => ReactNode
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? items : items.slice(0, 10)
  return (
    <>
      <ul className={cn('min-w-0', className)}>{shown.map(renderItem)}</ul>
      {items.length > 10 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((previous) => !previous)}
          className="border-border mt-4 w-full border px-6 py-4 text-sm font-medium hover:bg-[#1F1F1F]"
        >
          {expanded ? 'SHOW LESS' : `SHOW ${items.length - 10} MORE`}
        </button>
      )}
    </>
  )
}

function FindingDetails({
  finding,
  index,
}: {
  finding: Finding
  index: number
}) {
  const tone = severity(finding.severity)
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={index === 0 ? 'finding' : undefined}
      className="border-border border"
    >
      <AccordionItem value="finding">
        <AccordionTrigger className="px-4 py-5 lg:px-8">
          <div className="min-w-0 space-y-2 text-left">
            <p className="font-basic text-base font-semibold lg:text-lg">
              {finding.title || finding.message || finding.rule_id || 'Finding'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={tone}>{tone}</Badge>
              <span className="text-sm font-normal text-[#A9A9A9]">
                {finding.file}
                {finding.line != null && ` · line ${finding.line}`}
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="border-border space-y-6 border-t border-dashed p-6 lg:px-8">
          <p className="font-basic text-sm text-[#A9A9A9]">
            {finding.rule_id || 'Rule not reported'} ·{' '}
            {humanize(finding.tier || finding.reach)} · {humanize(finding.gate)}
          </p>
          {finding.detail && (
            <p className="font-basic text-base text-[#CACACA]">
              {finding.detail}
            </p>
          )}
          {text(finding.entry) && (
            <p className="font-basic text-sm text-[#A9A9A9]">
              Entry: {text(finding.entry)}
            </p>
          )}
          {finding.evidence && (
            <div>
              <h3 className="mb-3 text-sm text-[#A9A9A9]">QUOTED EVIDENCE</h3>
              <CodeBlock>{finding.evidence}</CodeBlock>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function SurfaceCard({ entry }: { entry: SurfaceEntry }) {
  return (
    <li className="border-border min-w-0 space-y-4 border p-6 lg:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold uppercase">{humanize(entry.tier)}</span>
        <span className="text-sm text-[#A9A9A9]">
          {entry.gate === 'none'
            ? 'No prompt or user gate'
            : humanize(entry.gate)}
        </span>
      </div>
      <h3 className="font-basic text-lg font-semibold">
        {entry.trigger || entry.kind || 'Execution entry'}
      </h3>
      {entry.file && (
        <p className="font-basic text-sm text-[#A9A9A9]">
          {entry.file}
          {entry.line != null && ` · line ${entry.line}`}
        </p>
      )}
      {entry.command && <CodeBlock>{entry.command}</CodeBlock>}
      {Boolean(entry.loads?.length) && (
        <p className="font-basic text-sm text-[#A9A9A9]">
          Loads: {entry.loads?.join(', ')}
        </p>
      )}
      {Boolean(entry.unresolved?.length) && (
        <p className="font-basic text-sm text-[#F6C76A]">
          Unresolved: {entry.unresolved?.join(', ')}
        </p>
      )}
      {Boolean(entry.platforms?.length) && (
        <p className="font-basic text-sm text-[#A9A9A9]">
          Platforms: {entry.platforms?.join(', ')}
        </p>
      )}
      {entry.detonatable === false && (
        <p className="font-basic text-sm text-[#A9A9A9]">
          Static analysis only; this entry cannot be detonated.
        </p>
      )}
    </li>
  )
}

function SignalPanel({
  title,
  findings,
  incomplete,
  className,
}: {
  title: string
  findings: Finding[]
  incomplete: boolean
  className?: string
}) {
  return (
    <div className={cn('border-border min-w-0 border-t p-6 lg:p-8', className)}>
      <h2 className={SECTION_TITLE}>{title}</h2>
      {findings.length ? (
        <ExpandableList
          items={findings}
          renderItem={(finding, index) => (
            <li
              key={`${finding.rule_id}-${index}`}
              className="border-border space-y-3 border-t py-5"
            >
              <Badge tone={severity(finding.severity)}>
                {severity(finding.severity)}
              </Badge>
              <h3 className="font-basic text-base font-semibold">
                {finding.title || finding.rule_id || 'Finding'}
              </h3>
              {finding.detail && (
                <p className="font-basic text-sm text-[#CACACA]">
                  {finding.detail}
                </p>
              )}
              {finding.evidence && <CodeBlock>{finding.evidence}</CodeBlock>}
            </li>
          )}
        />
      ) : (
        <p className="font-basic text-base text-[#A9A9A9]">
          No matching findings in this report.
          {incomplete &&
            ' Analysis is incomplete; this does not confirm their absence.'}
        </p>
      )}
    </div>
  )
}
