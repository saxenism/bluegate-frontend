const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8787'

export const API_BASE_URL = `${RAW_API_BASE_URL.replace(/\/$/, '')}/api/v1`

export const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#support', label: 'Support Us' },
  { href: 'https://bluethroatlabs.com', label: 'Bluethroat Labs' },
] as const
