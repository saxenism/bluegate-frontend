import { ContentPage } from '@/components/content-page'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  'How BlueGate works',
  'How a BlueGate scan pins a commit, maps the execution surface, and scores findings without treating a gap as safety.',
  '/how-it-works'
)

export default function Page() {
  return (
    <ContentPage
      title="How it works"
      lead="The website admits a scan. A worker, not the page, reads the repository."
      paper
    >
      <h2>Pin, then read</h2>
      <p>
        The URL has to be a public github.com repository. The ref (a branch, a
        tag, a commit, or the default branch) is resolved to a full SHA through
        the GitHub API. That SHA is what the report is about. The worker then
        fetches objects with hardened git: no checkout, no hooks, and a size
        limit. It reads the tree with plumbing commands rather than a working
        copy.
      </p>
      <h2>What would run</h2>
      <p>
        The surface map lists every entry the scan can see, by how little you
        have to do before it runs: clone, open, install, build, run, and the
        entries nothing reaches. Each entry names its gate (nothing, a prompt,
        an explicit opt-in) and the files it loads. Unattended means it runs
        with no gate.
      </p>
      <h2>What the files contain</h2>
      <p>
        Content checks look for hidden instructions, obfuscation, downloaders,
        and known-bad patterns, and quote the line. Dependency checks read
        manifests and lockfiles: malicious packages, look-alike names, registry
        overrides, and lockfile drift. Git-tree checks look for the repository
        attacking git itself: hooked configs, symlink tricks, and colliding
        names.
      </p>
      <h2>Detonation</h2>
      <p>
        When a sandbox is configured, the mapped commands run there, with
        canaries planted and egress recorded. Runtime findings can raise the
        verdict. They cannot clear one. With no sandbox, a scan that is not
        already MALICIOUS stays PARTIAL, because the run was not observed.
      </p>
      <h2>The score</h2>
      <p>
        Findings are scored and scaled by how early they run. CLEAN is below 10,
        SUSPICIOUS is 10-39, MALICIOUS is 40 and above. Reputation signals
        cannot convict alone. A required stage that failed or a coverage gap
        replaces any non-MALICIOUS verdict with PARTIAL. The report prints that
        coverage first.
      </p>
    </ContentPage>
  )
}
