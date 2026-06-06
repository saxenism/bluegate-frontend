'use client'

import { BluegateReport } from '@/lib/types'
import GithubIcon from '@/assets/icons/github.svg'
import DownloadIcon from '@/assets/icons/download.svg'
import LinkIcon from '@/assets/icons/link.svg'
import CheckIcon from '@/assets/icons/check.svg'
import { format } from 'date-fns'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover'
import { Progress } from './ui/progress'
import { cn } from '@/lib/utils/cn'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type Props = { data: BluegateReport }

const VERDICT_COLORS = {
  CRITICAL: '#780000',
  HIGH: '#DC0000',
  MEDIUM: '#FD8C00',
  GUARDED: '#FD8C00',
  LOW: '#00AC46',
  UNKNOWN: '#454545',
}

const VERDICT_LABELS_BG = {
  CRITICAL: '#D90C0C',
  HIGH: VERDICT_COLORS.HIGH,
  MEDIUM: VERDICT_COLORS.MEDIUM,
  GUARDED: VERDICT_COLORS.GUARDED,
  LOW: VERDICT_COLORS.LOW,
  UNKNOWN: VERDICT_COLORS.UNKNOWN,
}

const TOTAL_SCORE_SEGMENTS = 25
const INITIAL_LIST_VISIBLE_COUNT = 10

export const Report = ({ data }: Props) => {
  const [isCopied, setIsCopied] = useState(false)
  const [downloadPopoverOpen, setDownloadPopoverOpen] = useState(false)
  const [isDownloadLoading, setIsDownloadLoading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [showAllDependencyRisks, setShowAllDependencyRisks] = useState(false)
  const [showAllNetworkIndicators, setShowAllNetworkIndicators] =
    useState(false)
  const [showAllFindings, setShowAllFindings] = useState(false)

  const bluegateVerdict = data.verdict.level || 'UNKNOWN'
  const bluegateScore = data.verdict.bluegate_score ?? 0
  const scoreSegmentUnit = `calc(100% / ${TOTAL_SCORE_SEGMENTS * 2 - 1})`
  const filledScoreSegments = Math.max(
    0,
    Math.min(
      TOTAL_SCORE_SEGMENTS,
      Math.round((bluegateScore / 100) * TOTAL_SCORE_SEGMENTS)
    )
  )

  const handleCopy = async () => {
    if (isCopied) return

    setIsCopied(true)
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch (error) {
      console.error('Failed to copy:', error)
    } finally {
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleDownload = (format: 'json' | 'md') => {
    if (isDownloadLoading) return

    // simulate download
    setIsDownloadLoading(true)
    console.log(`Downloading report in ${format} format...`)

    // when done
    setDownloadPopoverOpen(false)
    setIsDownloadLoading(false)
    setIsDownloaded(true)
    setTimeout(() => setIsDownloaded(false), 2000)
  }

  const getFindingSeverityById = (id?: string) => {
    const finding = data.findings.find((f) => f.rule_id === id)
    return finding ? finding.severity : 'UNKNOWN'
  }

  const riskyPackages = data.dependencies.risky_packages ?? []
  const networkIndicators = data.network_indicators ?? []

  const visibleRiskyPackages = showAllDependencyRisks
    ? riskyPackages
    : riskyPackages.slice(0, INITIAL_LIST_VISIBLE_COUNT)
  const visibleNetworkIndicators = showAllNetworkIndicators
    ? networkIndicators
    : networkIndicators.slice(0, INITIAL_LIST_VISIBLE_COUNT)
  const visibleFindings = showAllFindings
    ? data.findings
    : data.findings.slice(0, INITIAL_LIST_VISIBLE_COUNT)

  const hiddenRiskyPackagesCount = Math.max(
    0,
    riskyPackages.length - INITIAL_LIST_VISIBLE_COUNT
  )
  const hiddenNetworkIndicatorsCount = Math.max(
    0,
    networkIndicators.length - INITIAL_LIST_VISIBLE_COUNT
  )
  const hiddenFindingsCount = Math.max(
    0,
    data.findings.length - INITIAL_LIST_VISIBLE_COUNT
  )

  return (
    <section className="border-border break-word mb-12 w-full border-y wrap-anywhere">
      {/* METADATA AND MENU */}
      <div className="border-border flex items-start justify-between border-b max-lg:flex-col-reverse lg:gap-4">
        <div className="flex gap-6 p-4 lg:p-8">
          <div>
            <GithubIcon className="size-8 lg:size-10" />
          </div>

          <div className="space-y-4">
            <p className="font-basic text-xl font-semibold wrap-anywhere lg:text-2xl">
              {data.repo.url}
            </p>

            <div className="font-basic flex flex-wrap text-sm text-[#8F8F8F] max-lg:flex-col lg:gap-8 lg:text-base">
              <div>
                COMMIT:{' '}
                <span className="font-semibold">
                  {data.repo.commit?.substring(0, 7)}
                </span>
              </div>
              <div>
                SCANNED:{' '}
                <span className="font-semibold">
                  {format(
                    new Date(data.repo.scanned_at),
                    'dd MMMM yyyy, hh:mm a'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-border flex border-b text-[#8F8F8F] max-lg:self-end">
          <Popover
            open={downloadPopoverOpen}
            onOpenChange={setDownloadPopoverOpen}
          >
            <PopoverTrigger asChild>
              <button className="border-border grid size-16 place-items-center border-l hover:bg-[#1F1F1F] lg:size-18">
                {isDownloaded ? (
                  <CheckIcon className="size-6" />
                ) : (
                  <DownloadIcon className="size-6" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <PopoverHeader>
                <PopoverTitle className="sr-only">
                  Download Options
                </PopoverTitle>
                <PopoverDescription className="flex flex-col text-lg leading-[150%] font-medium tracking-[-2%] text-[#A9A9A9]">
                  <button
                    className="px-8 py-4 hover:bg-[#1F1F1F]"
                    onClick={() => handleDownload('json')}
                  >
                    Download JSON
                  </button>
                  <button
                    className="px-8 py-4 hover:bg-[#1F1F1F]"
                    onClick={() => handleDownload('md')}
                  >
                    Download .md
                  </button>
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          <button
            className="border-border grid size-16 place-items-center border-l hover:bg-[#1F1F1F] lg:size-18"
            onClick={handleCopy}
          >
            {isCopied ? (
              <CheckIcon className="size-6" />
            ) : (
              <LinkIcon className="size-6" />
            )}
          </button>
        </div>
      </div>

      {/* BLUEGATE SCORE */}
      <div className="border-border grid grid-cols-1 border-b lg:grid-cols-3">
        <div className="relative p-8">
          <div
            className="absolute top-0 right-0 px-4 py-3 font-semibold tracking-[-2%]"
            style={{
              backgroundColor: `${VERDICT_LABELS_BG[bluegateVerdict]}26`,
              color: VERDICT_COLORS[bluegateVerdict],
            }}
          >
            {bluegateVerdict} RISK
          </div>

          <div className="font-basic mb-2 text-base tracking-[-2%] text-[#8F8F8F]">
            BLUEGATE SCORE
          </div>

          <div className="font-basic font-serif text-2xl tracking-[-2%]">
            <span
              className="mr-4 text-8xl"
              style={{ color: VERDICT_COLORS[bluegateVerdict] }}
            >
              {bluegateScore}
            </span>
            of 100
          </div>
        </div>

        <div className="border-border border-t p-8 lg:border-l">
          <div className="font-basic mb-8 text-base tracking-[-2%] text-[#8F8F8F]">
            SCAN CONFIDENCE
          </div>

          <div className="flex items-center gap-5 font-serif">
            <div className="shrink-0 text-6xl tracking-[-2%] capitalize">
              {data.verdict.scan_confidence_band}
            </div>

            <div className="w-full">
              <div className="font-basic flex justify-between gap-2">
                <div>{data.verdict.scan_confidence}% Coverage</div>
                <div>9 of 9 Stages</div>
              </div>

              <div>
                <Progress value={data.verdict.scan_confidence} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-border relative border-t p-8 lg:border-l">
          <div
            className="absolute top-0 right-0 px-4 py-3 font-semibold tracking-[-2%]"
            style={{
              backgroundColor: `${VERDICT_LABELS_BG[data.execution_paths?.[0]?.risk]}26`,
              color: VERDICT_COLORS[data.execution_paths?.[0]?.risk],
            }}
          >
            {data.execution_paths?.[0]?.risk}
          </div>

          <div className="font-basic mb-6 text-base tracking-[-2%] text-[#8F8F8F]">
            TOP EXECUTION PATH
          </div>

          <p className="font-basic mb-2 text-lg font-semibold">
            {data.execution_paths?.[0]?.label || 'Scan did not complete'}
          </p>
          <p className="font-basic text-sm font-medium text-[#8F8F8F]">
            {data.execution_paths?.[0]?.summary ||
              'Repo exceeded Bluegate v1 scan limits before a verdict could be reached.'}
          </p>
        </div>
      </div>

      {/* VERDICT */}
      <div
        className="border-border space-y-2 border-b p-8"
        style={{
          background: `linear-gradient(249.27deg, ${VERDICT_LABELS_BG[bluegateVerdict]}14 -41.17%, ${VERDICT_LABELS_BG[bluegateVerdict]}00 137.26%)`,
        }}
      >
        <p
          className="text-xl leading-[160%] font-semibold"
          style={{ color: VERDICT_COLORS[bluegateVerdict] }}
        >
          {data.verdict.summary ||
            'Bluegate could not complete enough analysis to assess this repo.'}
        </p>
        <p className="font-basic text-base font-medium text-[#8F8F8F]">
          {data.verdict.recommendation ||
            'Do not treat this as a safe result. The repo exceeded scan limits or returned errors. Try re-scanning a specific subfolder or a smaller fork.'}
        </p>
      </div>

      {/* SCORE BREAKDOWN */}
      <div className="border-border border-b p-8">
        <div className="font-basic mb-2 text-base text-[#8F8F8F]">
          SCORE BREAKDOWN
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="font-basic font-serif text-2xl tracking-[-2%]">
            <span
              className="mr-4 text-8xl"
              style={{ color: VERDICT_COLORS[bluegateVerdict] }}
            >
              {bluegateScore}
            </span>
            of 100
          </div>

          <div
            className="px-4 py-3 font-semibold tracking-[-2%]"
            style={{
              backgroundColor: `${VERDICT_LABELS_BG[bluegateVerdict]}26`,
              color: VERDICT_COLORS[bluegateVerdict],
            }}
          >
            {bluegateVerdict} RISK
          </div>
        </div>

        <div className="mt-8 flex" style={{ gap: scoreSegmentUnit }}>
          {Array.from({ length: TOTAL_SCORE_SEGMENTS }).map((_, index) => (
            <div
              key={`score-segment-${index}`}
              className={cn(
                'h-18 shrink-0 border',
                index < filledScoreSegments
                  ? 'border-[#666666] bg-[#666666]'
                  : 'border-[#454545] bg-transparent'
              )}
              style={{ width: scoreSegmentUnit }}
            />
          ))}
        </div>

        {!!data.score_drops?.length ? (
          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {data.score_drops.map((item) => (
              <div
                key={item.finding_ids.join('-')}
                className="flex items-start gap-3.5"
              >
                <div
                  className="h-18 w-4 shrink-0"
                  style={{
                    backgroundColor:
                      VERDICT_COLORS[
                        getFindingSeverityById(item.finding_ids[0])
                      ] + 66,
                  }}
                ></div>

                <div className="shrink-0 font-serif text-[32px] tracking-[-2%] text-[#FAFAFA]">
                  {item.score_impact}
                </div>

                <div className="ml-2.5 space-y-2">
                  <div className="font-basic text-lg font-semibold">
                    {item.reason}
                  </div>
                  <div className="font-basic text-sm font-medium text-[#8F8F8F]">
                    {item.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState className="mt-12" />
        )}
      </div>

      {/* EXECUTION PATHS 1 */}
      <div className="border-border border-b p-8">
        <div className="font-basic mb-8 text-base text-[#8F8F8F]">
          EXECUTION PATHS · BY USER ACTION
        </div>

        {!!data.execution_paths?.length ? (
          <div className="border-border grid grid-cols-1 border lg:grid-cols-2">
            {data.execution_paths?.map((path, index) => {
              const hasTopBorderMobile = index > 0
              const hasTopBorderDesktop = index >= 2
              const hasRightBorderDesktop = index % 2 === 0

              return (
                <div
                  key={path.findings.join('-')}
                  className={cn(
                    'border-border relative p-8',
                    hasTopBorderMobile && 'border-t',
                    'lg:border-t-0',
                    hasTopBorderDesktop && 'lg:border-t',
                    hasRightBorderDesktop && 'lg:border-r'
                  )}
                >
                  <div
                    className="absolute top-0 right-0 px-4 py-3 font-semibold tracking-[-2%]"
                    style={{
                      backgroundColor: `${VERDICT_LABELS_BG[path.risk]}26`,
                      color: VERDICT_COLORS[path.risk],
                    }}
                  >
                    {path.risk}
                  </div>

                  <p className="font-basic mb-2 text-lg font-semibold">
                    {path.label}
                  </p>

                  <p className="font-basic text-sm font-medium text-[#8F8F8F]">
                    {path.summary}
                  </p>
                </div>
              )
            })}

            {data.execution_paths.length > 1 &&
              data.execution_paths.length % 2 === 1 && (
                <div
                  aria-hidden="true"
                  className="border-border hidden lg:block lg:border-t"
                />
              )}
          </div>
        ) : (
          <EmptyState section="execution paths" />
        )}
      </div>

      {/* FINDINGS */}
      <div className="border-border border-b p-8">
        <div className="font-basic mb-8 text-base text-[#8F8F8F]">FINDINGS</div>

        {!!data.findings?.length ? (
          <Accordion
            type="multiple"
            className="border-border border"
            defaultValue={['item-0']}
          >
            {visibleFindings.map((finding, index) => (
              <AccordionItem value={`item-${index}`} key={`item-${index}`}>
                <AccordionTrigger className="p-0">
                  <div className="flex items-center gap-4 p-4 lg:gap-8 lg:px-12 lg:py-5">
                    <div
                      className="h-18 w-4 shrink-0"
                      style={{
                        backgroundColor: VERDICT_COLORS[finding.severity] + 66,
                      }}
                    ></div>

                    <div className="space-y-2">
                      <div className="font-basic text-base font-semibold lg:text-lg">
                        {finding.title}
                      </div>
                      <div className="font-basic text-sm font-medium text-[#8F8F8F]">
                        {finding.file || ''}
                        {!!finding.file && !!finding.line && ' · '}
                        {!!finding.line && 'line ' + finding.line}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-border font-basic space-y-8 border-t border-dashed p-6 text-base font-semibold text-[#8F8F8F] lg:px-12 lg:py-8">
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div>
                      <span className="font-normal">SEVERITY:</span>{' '}
                      {finding.severity}
                    </div>
                    <div>
                      <span className="font-normal">CONFIDENCE:</span>{' '}
                      {finding.confidence}
                    </div>
                    <div>
                      <span className="font-normal">SCORE IMPACT:</span>{' '}
                      {finding.score_impact}
                    </div>
                    <div>
                      <span className="font-normal">EVIDENCE:</span>{' '}
                      {finding.evidence}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-normal">WHY IT MATTERS:</div>
                    <p>{finding.explanation}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-normal">Recommendation:</div>
                    <p>{finding.recommendation}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <EmptyState section="findings" />
        )}

        {!!data.findings.length &&
          (hiddenFindingsCount > 0 || showAllFindings) && (
            <button
              className="font-basic border-border mt-4 w-full border px-8 py-4 text-sm font-medium hover:bg-[#1F1F1F]"
              onClick={() => setShowAllFindings((prevState) => !prevState)}
            >
              {showAllFindings
                ? 'SHOW LESS'
                : `SHOW ${hiddenFindingsCount} MORE`}
            </button>
          )}
      </div>

      {/* EXECUTION PATHS 2 */}
      <div className="border-border border-b p-8">
        <div className="font-basic mb-8 text-base text-[#8F8F8F]">
          EXECUTION PATHS · BY USER ACTION
        </div>

        <div className="border-border grid grid-cols-1 border lg:grid-cols-2">
          <div className="pb-8">
            <p className="font-basic p-8 pb-6 text-base text-[#8F8F8F] max-lg:px-6">
              DEPENDENCY RISKS
            </p>

            {!!riskyPackages.length ? (
              <div className="border-border border-b">
                {visibleRiskyPackages.map((pkg) => (
                  <div
                    key={pkg.evidence}
                    className="border-border relative border-t px-6 py-2 lg:px-8"
                  >
                    <div
                      className="absolute top-0 right-0 px-4 py-3 font-semibold tracking-[-2%]"
                      style={{
                        backgroundColor: `${VERDICT_LABELS_BG[pkg.severity]}26`,
                        color: VERDICT_COLORS[pkg.severity],
                      }}
                    >
                      {pkg.severity}
                    </div>

                    <p className="font-basic mb-2 pr-20 text-base font-semibold lg:text-lg">
                      {pkg.evidence}
                    </p>
                    <p className="font-basic text-sm font-medium text-[#8F8F8F]">
                      {pkg.explanation}
                    </p>
                  </div>
                ))}

                {(hiddenRiskyPackagesCount > 0 || showAllDependencyRisks) && (
                  <button
                    className="font-basic border-border w-full border-t px-8 py-4 text-sm font-medium hover:bg-[#1F1F1F]"
                    onClick={() =>
                      setShowAllDependencyRisks((prevState) => !prevState)
                    }
                  >
                    {showAllDependencyRisks
                      ? 'SHOW LESS'
                      : `SHOW ${hiddenRiskyPackagesCount} MORE`}
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="font-basic mb-2 text-lg font-semibold">
                  No dependency risks found.
                </p>
                <p className="font-basic text-sm font-medium text-[#8F8F8F]">
                  Bluegate did not detect any risky dependencies.
                </p>
              </>
            )}
          </div>

          <div className="border-border border-t pb-8 lg:border-t-0 lg:border-l">
            <p className="font-basic p-8 pb-6 text-base text-[#8F8F8F] max-lg:px-6">
              SUSPICIOUS URLS & DOMAINS
            </p>

            {!!networkIndicators.length ? (
              <div className="border-border border-b">
                {visibleNetworkIndicators.map((indicator) => (
                  <div
                    key={indicator.value}
                    className="border-border relative border-t px-6 py-2 lg:px-8"
                  >
                    <div
                      className="absolute top-0 right-0 px-4 py-3 font-semibold tracking-[-2%]"
                      style={{
                        backgroundColor: `${VERDICT_LABELS_BG[indicator.risk]}26`,
                        color: VERDICT_COLORS[indicator.risk],
                      }}
                    >
                      {indicator.risk}
                    </div>

                    <p className="font-basic mb-2 pr-20 text-base font-semibold lg:text-lg">
                      {indicator.value}
                    </p>
                    <p className="font-basic text-sm font-medium text-[#8F8F8F]">
                      {indicator.context}
                    </p>
                  </div>
                ))}

                {(hiddenNetworkIndicatorsCount > 0 ||
                  showAllNetworkIndicators) && (
                  <button
                    className="font-basic border-border w-full border-t px-8 py-4 text-sm font-medium hover:bg-[#1F1F1F]"
                    onClick={() =>
                      setShowAllNetworkIndicators((prevState) => !prevState)
                    }
                  >
                    {showAllNetworkIndicators
                      ? 'SHOW LESS'
                      : `SHOW ${hiddenNetworkIndicatorsCount} MORE`}
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="font-basic mb-2 text-lg font-semibold">
                  No suspicious URLs or domains found.
                </p>
                <p className="font-basic text-sm font-medium text-[#8F8F8F]">
                  Bluegate did not detect any risky URLs or domains.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CREDENTIAL & SOCIAL-ENGINEERING SIGNALS */}
      <div className="border-border border-b p-8">
        <div className="font-basic mb-8 text-base text-[#8F8F8F]">
          CREDENTIAL & SOCIAL-ENGINEERING SIGNALS
        </div>

        <div className="border-border grid grid-cols-1 border lg:grid-cols-2">
          <div className="p-6 lg:p-8">
            <p className="font-basic mb-4 text-base text-[#8F8F8F] lg:mb-8">
              CREDENTIAL PATH REFERENCES
            </p>

            <p className="font-basic mb-2 text-lg font-semibold">
              No credential references found.
            </p>
            <p className="font-basic text-sm font-medium text-[#8F8F8F]">
              Bluegate did not detect SSH, AWS, browser-profile, or wallet path
              strings.
            </p>

            {/* <p className="font-basic text-sm font-medium text-[#8F8F8F]">
              Bluegate found references to sensitive credential paths. This may
              indicate credential targeting, especially when combined with file
              reads, staging, or network upload behavior.
            </p> */}
          </div>

          <div className="border-border border-t p-6 lg:border-t-0 lg:border-l lg:p-8">
            <p className="font-basic mb-4 text-base text-[#8F8F8F] lg:mb-8">
              README SIGNALS
            </p>

            <p className="font-basic mb-2 text-lg font-semibold">
              README looks normal.
            </p>
            <p className="font-basic text-sm font-medium text-[#8F8F8F]">
              No pressure language, trust-workspace asks, or live-credential
              requests detected.
            </p>
          </div>
        </div>
      </div>

      {/* LIMITATIONS */}
      <div className="p-8 text-base">
        <div className="font-basic pb-8 text-[#8F8F8F]">LIMITATIONS</div>

        {!!data.limitations?.length ? (
          <ul className="space-y-4 text-[#8F8F8F]">
            {data.limitations.map((limitation, index) => (
              <li
                key={limitation}
                className="leading-[160%] font-semibold text-[#A9A9A9]"
              >
                <span className="mr-4">
                  {(index + 1).toString().padStart(2, '0')}{' '}
                </span>
                {limitation}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState section="limitations" />
        )}
      </div>
    </section>
  )
}

const EmptyState = ({ section = 'findings', className = '' }) => (
  <div className={cn('border-border border p-6 text-center', className)}>
    <p className="font-basic text-lg font-semibold">
      No {section} worth surfacing.
    </p>
    <p className="font-basic mt-2 text-sm font-medium text-[#8F8F8F]">
      Bluegate matched none of its detection rules above the surfacing
      threshold.
    </p>
  </div>
)
