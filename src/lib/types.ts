// BlueGate's stored-document contract (OpenAPI schema_version 1).
// Analysis sections can be absent/null, including on a finished partial scan.
export type ScanStatus = 'queued' | 'fetching' | 'analysing' | 'done' | 'failed'
export type Verdict = 'clean' | 'suspicious' | 'malicious' | 'partial'
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type Tier =
  | 'clone'
  | 'open'
  | 'install'
  | 'build'
  | 'run'
  | 'artifact'
  | 'delayed'
  | 'unreached'
export type Gate = 'none' | 'trust_prompt' | 'opt_in' | 'user' | 'ci'
export type DataRecord = Record<string, unknown>

export interface Finding {
  rule_id?: string | null
  family?: string | null
  layer?: string | null
  severity?: Severity | null
  title?: string | null
  message?: string | null
  detail?: string | null
  file?: string | null
  line?: number | null
  evidence?: string | null
  tier?: Tier | null
  reach?: string | null
  gate?: Gate | null
  entry?: unknown
  metadata?: DataRecord | null
}

export interface SurfaceEntry {
  id?: string | null
  tier?: Tier | null
  gate?: Gate | null
  kind?: string | null
  trigger?: string | null
  file?: string | null
  line?: number | null
  command?: string | null
  loads?: string[] | null
  unresolved?: string[] | null
  platforms?: string[] | null
  detonatable?: boolean | null
  metadata?: DataRecord | null
}

export interface StageRecord {
  name?: string | null
  status?:
    | 'ok'
    | 'skipped_disabled'
    | 'skipped_policy'
    | 'skipped_capacity'
    | 'failed'
    | 'timeout'
    | 'queued'
    | null
  required?: boolean | null
  started_at?: string | null
  duration_ms?: number | null
  error?: string | null
}

export interface Coverage {
  tiers_detonated?: string[] | null
  phase_failures?: DataRecord[] | null
  files_not_read?: DataRecord[] | null
  unscanned_remote_sources?: DataRecord[] | null
  unscanned_content?: DataRecord[] | null
  dependencies_not_resolved?: DataRecord[] | null
  surface_not_detonated?: DataRecord[] | null
  caps_hit?: DataRecord[] | null
  gaps?: DataRecord[] | null
}

export interface Breakdown {
  components?: DataRecord[] | null
  total?: number | null
  thresholds?: Record<string, number> | null
  rounding?: string | null
  verdict_reason?: string | null
  capped_from?: number | null
  signal_cap?: DataRecord | null
  context_cap?: DataRecord | null
  static?: DataRecord | null
}

export interface Dependencies {
  resolved_at?: string | null
  use_time_resolution?: boolean | null
  packages_total?: number | null
  packages_truncated?: boolean | null
  packages?: DataRecord[] | null
  manifests?: DataRecord[] | null
  transitive_status?: string | null
  transitive_error?: string | null
  feeds?: DataRecord | null
  lockfile?: Record<string, string> | null
}

export interface ListingCount {
  total?: number | null
  listed?: number | null
}

export interface ScanDocument {
  schema_version: string
  scan_id: string
  status: ScanStatus
  created_at: string
  updated_at: string
  complete: boolean
  input: {
    repo?: string | null
    commit?: string | null
    ref?: string | null
    options: {
      provenance?: boolean | null
      transitive?: boolean | null
      [key: string]: unknown
    }
    submodules: DataRecord[]
  }
  analyzer: {
    analysis_fingerprint: string
    version?: string | null
    build_id?: string | null
  }
  verdict?: Verdict | null
  static_verdict?: Verdict | null
  score?: number | null
  verdict_reason?: string | null
  coverage?: Coverage | null
  surface?: SurfaceEntry[] | null
  findings?: Finding[] | null
  breakdown?: Breakdown | null
  stages?: StageRecord[] | null
  dependencies?: Dependencies | null
  listing?: {
    findings?: ListingCount | null
    surface?: ListingCount | null
    truncated?: boolean | null
  } | null
  clone_command?: string | null
  valid_until?: string | null
  delta?: DataRecord | null
  error?: string | null
  error_code?: string | null
}

export interface ScanAccepted {
  scan_id: string
  status: ScanStatus
  repo: string
  commit: string
  ref?: string | null
  poll: string
}

export type ScanSubmission = ScanAccepted | ScanDocument
export type ReportFormat = 'json' | 'text' | 'agent'

export const isScanId = (id: string) => /^[0-9a-f]{32}$/.test(id)
export const isTerminalScan = (scan: { status: ScanStatus }) =>
  scan.status === 'done' || scan.status === 'failed'
export const isRecord = (value: unknown): value is DataRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const statuses: readonly string[] = [
  'queued',
  'fetching',
  'analysing',
  'done',
  'failed',
]

const isString = (value: unknown) => typeof value === 'string'
const isNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
const optional = (value: unknown, check: (value: unknown) => boolean) =>
  value == null || check(value)
const arrayOf = (value: unknown, check: (value: unknown) => boolean) =>
  Array.isArray(value) && value.every(check)
const stringFields = (value: DataRecord, keys: string[]) =>
  keys.every((key) => optional(value[key], isString))

function isFinding(value: unknown) {
  return (
    isRecord(value) &&
    stringFields(value, [
      'rule_id',
      'family',
      'layer',
      'severity',
      'title',
      'message',
      'detail',
      'file',
      'evidence',
      'tier',
      'reach',
      'gate',
    ]) &&
    optional(value.line, isNumber) &&
    optional(value.metadata, isRecord)
  )
}

function isSurface(value: unknown) {
  return (
    isRecord(value) &&
    stringFields(value, [
      'id',
      'tier',
      'gate',
      'kind',
      'trigger',
      'file',
      'command',
    ]) &&
    optional(value.line, isNumber) &&
    ['loads', 'unresolved', 'platforms'].every((key) =>
      optional(value[key], (items) => arrayOf(items, isString))
    )
  )
}

function isStage(value: unknown) {
  return (
    isRecord(value) &&
    stringFields(value, ['name', 'status', 'started_at', 'error']) &&
    optional(value.required, (flag) => typeof flag === 'boolean') &&
    optional(value.duration_ms, isNumber)
  )
}

function isListing(value: unknown) {
  return (
    isRecord(value) &&
    ['findings', 'surface'].every((key) =>
      optional(
        value[key],
        (count) =>
          isRecord(count) &&
          optional(count.total, isNumber) &&
          optional(count.listed, isNumber)
      )
    )
  )
}

function isCoverage(value: unknown) {
  const groups = [
    'phase_failures',
    'files_not_read',
    'unscanned_remote_sources',
    'unscanned_content',
    'dependencies_not_resolved',
    'surface_not_detonated',
    'caps_hit',
    'gaps',
  ]
  return (
    isRecord(value) &&
    optional(value.tiers_detonated, (items) => arrayOf(items, isString)) &&
    groups.every((key) =>
      optional(value[key], (items) => arrayOf(items, isRecord))
    )
  )
}

export function isScanDocument(value: unknown): value is ScanDocument {
  if (!isRecord(value) || !isRecord(value.input) || !isRecord(value.analyzer))
    return false
  return (
    value.schema_version === '1' &&
    typeof value.scan_id === 'string' &&
    isScanId(value.scan_id) &&
    typeof value.status === 'string' &&
    statuses.includes(value.status) &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string' &&
    typeof value.complete === 'boolean' &&
    stringFields(value, [
      'verdict_reason',
      'static_verdict',
      'clone_command',
      'valid_until',
      'error',
      'error_code',
    ]) &&
    stringFields(value.input, ['repo', 'commit', 'ref']) &&
    isRecord(value.input.options) &&
    arrayOf(value.input.submodules, isRecord) &&
    typeof value.analyzer.analysis_fingerprint === 'string' &&
    stringFields(value.analyzer, ['version', 'build_id']) &&
    (value.verdict == null ||
      ['clean', 'suspicious', 'malicious', 'partial'].includes(
        String(value.verdict)
      )) &&
    (value.score == null ||
      (typeof value.score === 'number' &&
        Number.isInteger(value.score) &&
        value.score >= 0 &&
        value.score <= 100)) &&
    optional(value.findings, (items) => arrayOf(items, isFinding)) &&
    optional(value.surface, (items) => arrayOf(items, isSurface)) &&
    optional(value.stages, (items) => arrayOf(items, isStage)) &&
    optional(value.coverage, isCoverage) &&
    optional(
      value.breakdown,
      (breakdown) =>
        isRecord(breakdown) &&
        optional(breakdown.components, (items) => arrayOf(items, isRecord))
    ) &&
    optional(
      value.dependencies,
      (dependencies) =>
        isRecord(dependencies) && optional(dependencies.resolved_at, isString)
    ) &&
    optional(value.listing, isListing)
  )
}

export function isScanSubmission(value: unknown): value is ScanSubmission {
  if (isScanDocument(value)) return true
  return (
    isRecord(value) &&
    typeof value.scan_id === 'string' &&
    isScanId(value.scan_id) &&
    typeof value.status === 'string' &&
    statuses.includes(value.status) &&
    typeof value.repo === 'string' &&
    typeof value.commit === 'string' &&
    typeof value.poll === 'string'
  )
}
