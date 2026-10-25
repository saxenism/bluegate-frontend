import type { MetadataRoute } from 'next'
import { SITE_LINKS, SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    ...SITE_LINKS.map(({ href }) => ({ url: `${SITE_URL}${href}` })),
  ]
}
