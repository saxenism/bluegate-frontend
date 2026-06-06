export const executionPaths = [
  'open_in_vscode',
  'open_in_cursor',
  'trust_workspace',
  'folder_open_task',
  'debug_launch',
  'npm_install',
  'npm_run_dev',
  'npm_start',
  'npm_test',
  'npm_build',
  'readme_command',
  'devcontainer_open',
  'docker_build',
  'github_actions',
  'unknown',
] as const

export type ExecutionPath = (typeof executionPaths)[number]

export const executionPathLabels: Record<ExecutionPath, string> = {
  open_in_vscode: 'Opening in VS Code',
  open_in_cursor: 'Opening in Cursor',
  trust_workspace: 'Trusting the workspace',
  folder_open_task: 'VS Code/Cursor folder-open task',
  debug_launch: 'Starting a debug launch',
  npm_install: 'Running npm install',
  npm_run_dev: 'Running npm run dev',
  npm_start: 'Running npm start',
  npm_test: 'Running npm test',
  npm_build: 'Running npm run build',
  readme_command: 'Following README instructions',
  devcontainer_open: 'Opening a devcontainer',
  docker_build: 'Running Docker',
  github_actions: 'Running GitHub Actions',
  unknown: 'Unknown trigger',
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH'
export type VerdictLevel =
  | 'LOW'
  | 'GUARDED'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'UNKNOWN'

export type FindingCategory =
  | 'repo-reputation'
  | 'fork-divergence'
  | 'git-forensics'
  | 'file-inventory'
  | 'editor-auto-exec'
  | 'package-script'
  | 'dependency'
  | 'package-manager-config'
  | 'config-injection'
  | 'remote-loader'
  | 'dynamic-execution'
  | 'wallet-theft'
  | 'browser-theft'
  | 'cloud-secret'
  | 'clipboard'
  | 'persistence'
  | 'web3'
  | 'social-engineering'
  | 'ioc'
  | 'ci-cd'
  | 'container'

export interface RuleFinding {
  id: string
  rule_id: string
  title: string
  severity: Severity
  confidence: Confidence
  category: FindingCategory
  file?: string
  line?: number
  evidence?: string
  execution_paths: ExecutionPath[]
  explanation: string
  recommendation: string
  references?: string[]
  iocSource?: string
  tags?: string[]
  score_impact?: number
  metadata?: Record<string, unknown>
}

export type ComboActivationState =
  | 'active'
  | 'inactive_missing_prerequisite'
  | 'inactive_disabled'

export interface ComboRuleStatus {
  comboRuleId: string
  state: ComboActivationState
  reason?: string
}

export interface ComboFinding {
  comboRuleId: string
  title: string
  severity: Severity
  confidence: Confidence
  findingIds: string[]
  explanation: string
  recommendation: string
  scoreFloor?: number
}

export interface RepoReportInfo {
  url: string
  provider: 'github' | 'local'
  owner: string
  name: string
  commit: string | null
  scanned_at: string
  scan_type: 'static_v1'
  is_fork: boolean
  upstream: null | {
    full_name: string
    html_url?: string
    default_branch?: string
  }
}

export interface VerdictReport {
  level: VerdictLevel
  bluegate_score: number | null
  risk_band: string
  scan_confidence: number
  scan_confidence_band: 'low' | 'medium' | 'high'
  summary: string
  recommendation: string
}

export interface ExecutionPathReport {
  trigger: ExecutionPath
  label: string
  risk: VerdictLevel
  commands: string[]
  findings: string[]
  summary: string
}

export interface DependencyReport {
  package_managers: string[]
  lockfiles: string[]
  risky_packages: RuleFinding[]
}

export interface NetworkIndicatorReport {
  type: 'url' | 'domain' | 'ip'
  value: string
  source: string
  risk: Severity
  context: string
}

export interface ScoreDropsReport {
  reason: string
  score_impact: number
  finding_ids: string[]
  summary: string
}

export interface BluegateReport {
  repo: RepoReportInfo
  verdict: VerdictReport
  findings: RuleFinding[]
  combo_findings: ComboFinding[]
  combo_statuses: ComboRuleStatus[]
  execution_paths: ExecutionPathReport[]
  dependencies: DependencyReport
  network_indicators: NetworkIndicatorReport[]
  limitations: string[]
  score_drops: ScoreDropsReport[]
}
