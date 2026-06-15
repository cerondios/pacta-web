const TOKEN_KEY = 'pacta_token'

/** Store the JWT in a cookie that expires in `seconds` seconds. */
export function setTokenCookie(token: string, seconds: number) {
  const expires = new Date(Date.now() + seconds * 1000).toUTCString()
  // SameSite=Lax works for same-origin API calls; Secure is added in production
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax${secure}`
}

/** Read the JWT from the cookie, or null if absent. */
export function getTokenCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_KEY}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

/** Delete the token cookie (logout). */
export function clearTokenCookie() {
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}

