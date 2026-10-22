'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      theme: 'dark'
      size: 'flexible'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    }
  ) => string
  remove: (id: string) => void
  reset: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string
  onToken: (token: string | null) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const renderWidget = useCallback(() => {
    if (!window.turnstile || !container.current || widget.current !== null)
      return
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      theme: 'dark',
      size: 'flexible',
      callback: (token) => {
        setError(null)
        onToken(token)
      },
      'expired-callback': () => onToken(null),
      'error-callback': () => {
        onToken(null)
        setCanRetry(true)
        setError('Verification could not finish. Try the check again.')
      },
    })
  }, [siteKey, onToken])

  useEffect(() => {
    renderWidget()
    return () => {
      if (widget.current !== null) window.turnstile?.remove(widget.current)
      widget.current = null
    }
  }, [renderWidget])

  return (
    <div className="mt-5 space-y-3">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={renderWidget}
        onError={() => {
          onToken(null)
          setCanRetry(false)
          setError(
            'Verification could not load. Check your connection, then reload the page.'
          )
        }}
      />
      <div ref={container} />
      {error && (
        <p role="alert" className="text-sm text-[#F07979]">
          {error}{' '}
          {canRetry && (
            <button
              type="button"
              onClick={() => {
                if (widget.current !== null)
                  window.turnstile?.reset(widget.current)
                setError(null)
              }}
              className="underline underline-offset-4"
            >
              Retry verification
            </button>
          )}
        </p>
      )}
    </div>
  )
}
