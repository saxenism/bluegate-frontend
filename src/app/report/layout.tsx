import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Repository report | BlueGate',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function ReportLayout({ children }: { children: ReactNode }) {
  return children
}
