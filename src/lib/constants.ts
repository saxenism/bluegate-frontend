export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  'https://bluegate-api.wittymushroom-3baccaaf.centralindia.azurecontainerapps.io'
).replace(/\/+$/u, '')

export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
