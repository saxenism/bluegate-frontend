import Link from 'next/link'
import { ContentPage } from '@/components/content-page'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  'Privacy | BlueGate',
  'What the BlueGate website stores when you submit a public repository URL.',
  '/privacy'
)

export default function Page() {
  return (
    <ContentPage
      title="Privacy"
      lead="Submitting a scan sends a public repository URL, and an optional ref, to this service."
    >
      <h2>What you send</h2>
      <p>
        The form sends the repository URL, the optional ref, and, when the
        server requires it, a Cloudflare Turnstile token. Do not put secrets,
        private package contents, or credentials in the URL or the ref. BlueGate
        accepts public github.com repositories only.
      </p>
      <h2>What the service does with that</h2>
      <p>
        It asks GitHub to pin the ref to a commit, fetches the public git
        objects, and may fetch README-linked release assets of that same
        repository and public registry metadata for dependencies. It stores a
        result document: the URL, the commit, the verdict, coverage, and quoted
        evidence. The scan id is derived from the repository, the commit, and
        the analyzer. It is not a secret capability; anyone who has it can read
        that result.
      </p>
      <p>
        Admission is logged with the scan id and, for a signed-in Bluethroat CLI
        user, the numeric GitHub user id. Tokens and Turnstile secrets are not
        written to that log.
      </p>
      <h2>Browser storage</h2>
      <p>
        Your selected appearance is saved in local storage. This browser also
        keeps up to ten completed reports in local storage so a saved report can
        remain available during a temporary connection problem. Cached reports
        are only used while their validity window is still open.
      </p>
      <h2>Other parties</h2>
      <p>
        The page is loaded from this host. A configured human check loads
        Cloudflare Turnstile. Fonts are served with this site. Links to GitHub
        and Bluethroat Labs leave this site.
      </p>
      <p>
        For a question about stored results, use{' '}
        <Link href="/support">Support</Link>.
      </p>
    </ContentPage>
  )
}
