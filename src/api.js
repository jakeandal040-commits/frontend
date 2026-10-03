const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
const defaultBase = import.meta.env.DEV ? '/api' : localHost ? '/lab6/public/api' : 'https://backend-znst.onrender.com/api'
const base = (import.meta.env.VITE_API_URL?.trim() || defaultBase).replace(/\/$/, '')
const key = 'stockroom-session'
let refreshing = null
export function getSession() { try { return JSON.parse(sessionStorage.getItem(key)) } catch { return null } }
export function saveSession(data) { sessionStorage.setItem(key, JSON.stringify(data)) }
export function clearSession() { sessionStorage.removeItem(key) }
export async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const session = getSession()
  let response
  try { response = await fetch(`${base}${path}`, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(auth && session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) }) }
  catch { throw new Error('Cannot reach the server. Check your connection and make sure the API is running.') }
  if (response.status === 401 && auth && retry && session?.refresh_token) {
    try {
      if (!refreshing) refreshing = request('/auth/refresh', { method: 'POST', body: { refresh_token: session.refresh_token }, auth: false, retry: false }).then(data => { saveSession({ ...session, ...data.tokens }) }).finally(() => { refreshing = null })
      await refreshing
      return await request(path, { method, body, auth, retry: false })
    } catch (error) {
      if (error.status === 401 || error.status === 403) { clearSession(); window.dispatchEvent(new Event('session-expired')) }
      throw error
    }
  }
  let data = {}
  if (response.status !== 204) {
    try { data = await response.json() }
    catch {
      const error = new Error(response.status >= 500
        ? 'The server is temporarily unavailable. Please try again shortly.'
        : 'The server returned an unexpected response. Refresh this page and try again.')
      error.status = response.status
      throw error
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('The server returned an unexpected response. Refresh this page and try again.')
    }
  }
  if (!response.ok) {
    if (response.status === 401 && auth) { clearSession(); window.dispatchEvent(new Event('session-expired')) }
    const error = new Error(data.error || 'Something went wrong. Please try again.')
    error.status = response.status; error.errors = data.errors
    throw error
  }
  return data
}
