import {
  isRecord,
  type Coverage,
  type DataRecord,
  type Finding,
  type ScanDocument,
  type Severity,
} from '@/lib/types'

export const SEVERITY_ORDER: readonly string[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
  'unknown',
]

export function text(value: unknown): string {
  return typeof value === 'string'
    ? value
    : typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : ''
}

export function severity(value: unknown): Severity | 'unknown' {
  return typeof value === 'string' && SEVERITY_ORDER.includes(value)
    ? (value as Severity | 'unknown')
    : 'unknown'
}

export function humanize(value?: string | null) {
  return value ? value.replace(/_/g, ' ') : 'Not reported'
}

export function getReportView(doc: ScanDocument) {
  const findings = [...(doc.findings ?? [])].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(severity(a.severity)) -
      SEVERITY_ORDER.indexOf(severity(b.severity))
  )
  const stages = doc.stages ?? []
  const required = stages.filter((stage) => stage.required)
  const completed = required.filter((stage) => stage.status === 'ok').length
  const coverage = coverageGroups(doc.coverage)
  const missingStages = required.filter((stage) => stage.status !== 'ok')
  if (missingStages.length)
    coverage.unshift({
      label: 'Required stages not completed',
      items: missingStages.map(
        (stage) =>
          `${humanize(stage.name)}: ${humanize(stage.status)}${stage.error ? ` — ${stage.error}` : ''}`
      ),
    })
  const incomplete =
    !doc.complete || doc.verdict === 'partial' || coverage.length > 0
  const byRule = (finding: Finding) => finding.rule_id?.toUpperCase() ?? ''
  const byFamily = (finding: Finding) =>
    finding.family?.toUpperCase() ?? byRule(finding).replace(/\d+$/u, '')
  const componentRecords = doc.breakdown?.components ?? []
  const components = componentRecords
    .filter(isRecord)
    .map((item, index) => ({
      id: `${text(item.rule_id)}-${index}`,
      rule: text(item.rule_id) || 'Analysis component',
      severity: severity(item.severity),
      points: typeof item.points === 'number' ? item.points : null,
      description: [
        text(item.tier),
        text(item.gate),
        typeof item.files === 'number'
          ? `${item.files} file${item.files === 1 ? '' : 's'}`
          : '',
        text(item.note),
      ]
        .filter(Boolean)
        .join(' · '),
      title: findings.find((finding) => finding.rule_id === item.rule_id)
        ?.title,
    }))
  return {
    findings,
    stages,
    required,
    completed,
    incomplete,
    coverage,
    components,
    dependencies: findings.filter(
      (finding) =>
        byFamily(finding) === 'DEP' || finding.layer === 'dependencies'
    ),
    network: findings.filter(
      (finding) =>
        byFamily(finding) === 'NET' ||
        byRule(finding) === 'IOC002' ||
        ['second-stage', 'remote-exec', 'downloader', 'exfiltration'].includes(
          text(finding.metadata?.category)
        )
    ),
    credentials: findings.filter(
      (finding) =>
        byFamily(finding) === 'CRED' ||
        ['AST012', 'AST013'].includes(byRule(finding))
    ),
    readme: findings.filter(
      (finding) =>
        ['PI', 'RCI', 'GRD'].includes(byFamily(finding)) ||
        byRule(finding) === 'CNT016'
    ),
  }
}

function coverageGroups(coverage?: Coverage | null) {
  const labels: [keyof Coverage, string][] = [
    ['gaps', 'Coverage gaps'],
    ['phase_failures', 'Execution failures'],
    ['files_not_read', 'Files not read'],
    ['unscanned_remote_sources', 'Remote sources not scanned'],
    ['unscanned_content', 'Content not scanned'],
    ['dependencies_not_resolved', 'Dependencies not resolved'],
    ['surface_not_detonated', 'Execution entries not detonated'],
    ['caps_hit', 'Scan limits reached'],
  ]
  return labels.flatMap(([key, label]) => {
    const items = coverage?.[key]
    if (!Array.isArray(items) || !items.length) return []
    return [
      {
        label,
        items: items.map((item) => formatCoverageItem(item)).filter(Boolean),
      },
    ]
  })
}

function formatCoverageItem(item: unknown) {
  if (!isRecord(item)) return text(item)
  const keys = [
    'phase',
    'command',
    'path',
    'file',
    'url',
    'manifest',
    'ecosystem',
    'name',
    'entry',
    'cap',
    'limit',
    'reason',
    'detail',
    'error',
  ]
  return (
    keys
      .map((key) => text(item[key]))
      .filter(Boolean)
      .join(' · ') || 'The scanner reported an analysis gap.'
  )
}

export function getRecommendation(doc: ScanDocument) {
  if (doc.status === 'failed')
    return 'This scan did not finish. There is no verdict. Start a new scan when the scanner is available.'
  switch (doc.verdict) {
    case 'malicious':
      return 'Do not clone, open, install, or run this commit. Review the quoted evidence below.'
    case 'suspicious':
      return 'Review the quoted findings before trusting this commit. This result does not clear the repository.'
    case 'partial':
      return 'Required analysis did not finish or coverage has gaps. Review what was missed before deciding whether to use this commit.'
    case 'clean':
      return 'The required analysis completed without findings reaching the detection threshold. This is not a certificate of safety.'
    default:
      return 'This scan has no verdict. A missing verdict does not clear the repository.'
  }
}

export function getBreakdownNotes(
  breakdown: ScanDocument['breakdown']
): string[] {
  if (!breakdown) return []
  return [
    breakdown.capped_from != null
      ? `The combined score was capped from ${breakdown.capped_from} points.`
      : '',
    text(breakdown.signal_cap?.reason),
    text(breakdown.context_cap?.reason),
  ].filter(Boolean)
}

export function isExpired(doc: ScanDocument) {
  return Boolean(
    doc.valid_until &&
    Number.isFinite(Date.parse(doc.valid_until)) &&
    Date.parse(doc.valid_until) <= Date.now()
  )
}

export function recordSummary(record: DataRecord) {
  return ['path', 'commit', 'verdict', 'status']
    .map((key) => text(record[key]))
    .filter(Boolean)
    .join(' · ')
}
