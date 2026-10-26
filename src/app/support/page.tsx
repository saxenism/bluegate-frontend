import { ContentPage } from '@/components/content-page'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata(
  'Support | BlueGate',
  'How to report a BlueGate bug or a security issue.',
  '/support'
)

export default function Page() {
  return (
    <ContentPage
      title="Support"
      lead="Public issues are visible to everyone. Do not include secrets."
    >
      <p>
        For a reproducible bug or a general question, open an issue in the{' '}
        <a
          href="https://github.com/BluethroatLabs/BlueGate/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          BlueGate repository
        </a>
        .
      </p>
      <h2>What to include</h2>
      <ul>
        <li>The repository URL, ref, and scan id.</li>
        <li>The verdict you saw and the verdict you expected.</li>
        <li>Whether you used the website, the API, or the CLI.</li>
      </ul>
      <p>
        Do not paste credentials, private repository contents, or Turnstile
        tokens.
      </p>
      <h2>Security reports</h2>
      <p>
        Do not report a suspected security or privacy vulnerability in a public
        issue. Use a private channel the repository maintainers offer.
      </p>
    </ContentPage>
  )
}
