import { ContentPage } from '@/components/content-page'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  'About BlueGate',
  'What BlueGate checks, what a verdict means, and what it does not certify.',
  '/about'
)

export default function Page() {
  return (
    <ContentPage
      title="About"
      lead="BlueGate answers one question: is this repository, at this commit, safe to clone, open, install, and run the way its README says?"
      paper
    >
      <p>
        It checks the files a person is about to trust, once, before they trust
        them. The result is a verdict and the quoted line behind every finding.
        Coverage is part of the answer. A file that was not read is not a clean
        file.
      </p>
      <h2>What the words mean</h2>
      <ul>
        <li>
          <strong>CLEAN</strong> means the required stages ran and nothing
          reached the score that would flag the commit. It is not a certificate
          of safety.
        </li>
        <li>
          <strong>SUSPICIOUS</strong> means read the quoted lines before you
          trust it. It is a flag, not a clearance.
        </li>
        <li>
          <strong>MALICIOUS</strong> means do not clone, open, install, or run
          that commit.
        </li>
        <li>
          <strong>PARTIAL</strong> means something required did not run, or
          coverage has a gap. It is a floor, not a weak CLEAN. Absence of
          observation is not safety.
        </li>
      </ul>
      <h2>What it does not do</h2>
      <p>
        BlueGate does not watch the repository after the scan. It does not
        certify a maintainer, a future commit, or a package that install will
        fetch later. A public release asset linked from the README can be
        swapped without a new commit; when the result lists those assets, a
        later request re-checks their hashes.
      </p>
      <p>
        The scanner does not check the tree out on your machine. Intake fetches
        git objects into a bare repository with hooks and checkout disabled.
        Detonation, when a sandbox is configured, runs in a disposable
        environment and can only raise the verdict.
      </p>
      <p>
        An approval, for a signed-in GitHub user, freezes one finished scan so a
        later scan of the same repository can show what changed. The website
        submits a fresh scan. Approvals are on the API.
      </p>
    </ContentPage>
  )
}
