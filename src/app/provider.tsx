'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'

export default function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      })
  )
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="bluegate-theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}
