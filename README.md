# BlueGate frontend

A Next.js frontend for the current BlueGate scanner API. Paste a public GitHub
repository (or a branch/commit URL) to scan it, follow its progress, and share
the report URL.

The optional **Ref** field selects a branch, tag, or commit, including branch
names containing `/`. Leave it empty to use the ref in a pasted URL or the
repository's default branch. If both the URL and the Ref field specify a ref,
they must match.

## Run locally

```sh
yarn install
yarn dev
```

Open `http://localhost:3000`. The browser calls the hosted BlueGate API
directly. To configure a local backend or Turnstile, copy `.env.example` to
`.env.local` and restart Next.js:

| Variable                         | Purpose                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL`       | Backend origin, without `/api/v1`. Defaults to the hosted Azure API.                                                                 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional public widget key matching the backend when anonymous scans require Turnstile. The widget must allow the frontend hostname. |

These public values are included in the frontend at build time. Rebuild after
changing them in production. Keep API keys and Turnstile secrets out of frontend
environment variables; this UI uses anonymous scanning with optional Turnstile.
The backend validates widget tokens.

The backend must allow the frontend origin through CORS. Localhost origins are
already allowed by the hosted API. Add the production frontend origin to the
backend's `BLUEGATE_CORS_ORIGINS` setting when deploying.

## Integration

`src/lib/api.ts` sends scan, polling, and download requests directly to the
configured backend. There are no Next.js API routes or proxy configuration.

- Submit: `POST /scans` with `repo_url`, `provenance`, and `transitive` options.
  Handles both 202 admission and 200 cached documents.
- Progress/report: `GET /scans/{id}`. Polls `queued`, `fetching`, and
  `analysing`; stops on `done` or `failed`. The report URL exists immediately
  after admission and survives refreshes. Transient errors retry with
  `Retry-After` respected; submission itself is never automatically retried.
- Downloads: JSON, plain text, and agent reports from that endpoint using
  `?format=json|text|agent`.
- Presentation: higher scores mean greater risk. Verdicts are `clean`,
  `suspicious`, `malicious`, or `partial`. Coverage and required-stage
  completion are shown independently. Missing scores stay unscored, and missing
  analysis never becomes a clean result. Signal panels select actual finding
  families and metadata; they do not claim the old detectors have exact
  equivalents.
- Cache: only valid finished schema-1 documents enter the versioned browser
  cache. In-progress scans always resume from the API. Cached documents are
  revalidated on opening, and expired reports remain viewable from the backend
  with a historical-result notice. Old UUID report links require a new scan.

The backend's rough frontend uses the same contract. GitHub sign-in, approvals,
and comparison flows are not part of the current scanner UI.

## Build for production

```sh
yarn build
yarn start
```
