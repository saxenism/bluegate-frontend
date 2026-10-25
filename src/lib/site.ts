import type { Metadata } from 'next'

export const SITE_URL = 'https://bluegate.bluethroatlabs.com'
export const SITE_NAME = 'BlueGate by Bluethroat Labs'
export const SOCIAL_IMAGE_PATH = '/opengraph-image.png'
export const SOCIAL_IMAGE_ALT =
  'BlueGate by Bluethroat Labs. Check a repository before you trust it.'
export const SOURCE_URL = 'https://github.com/BluethroatLabs/BlueGate'
export const SITE_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/for-agents', label: 'For agents' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/support', label: 'Support' },
] as const

export function pageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: SOCIAL_IMAGE_PATH,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SOCIAL_IMAGE_PATH],
    },
  }
}
