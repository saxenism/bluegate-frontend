import Link from 'next/link'
import { ContentPage } from '@/components/content-page'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  'Terms | BlueGate',
  'Terms for the BlueGate website and scan API. A verdict is evidence, not a certification.',
  '/terms'
)

export default function Page() {
  return (
    <ContentPage
      title="Terms"
      lead="You decide whether to submit a repository and whether to trust the commit afterward."
    >
      <h2>The result</h2>
      <p>
        BlueGate reports what a scan of one commit observed, with quoted lines
        and an account of what it did not cover. CLEAN, SUSPICIOUS, MALICIOUS,
        and PARTIAL are defined on the <Link href="/about">About</Link> page.
        None of them is a promise that a repository is safe, lawful, or fit for
        a purpose. A later commit, a swapped release asset, or a package
        resolved at install time can differ from what was scanned.
      </p>
      <h2>What you may submit</h2>
      <p>
        Submit public github.com URLs only, and only repositories you are
        willing to have fetched and stored as a scan result. Do not submit
        secrets. The service may refuse a URL, rate-limit a caller, or return a
        cached result for the same commit.
      </p>
      <h2>Availability</h2>
      <p>
        The service is provided as is, without a promise of uninterrupted
        scanning or a particular verdict. To the extent permitted by applicable
        law, the authors and operators disclaim warranties of merchantability,
        fitness for a particular purpose, and non-infringement.
      </p>
      <p>
        Questions go through <Link href="/support">Support</Link>.
      </p>
    </ContentPage>
  )
}
