/**
 * Thin client for the SmartDine API.
 *
 * The bearer token is held in localStorage so a reload restores the session;
 * the server also sets an httpOnly cookie, so either path authenticates. Every
 * failure arrives as an `ApiError` carrying the server's message and any
 * per-field details, which the forms render directly.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const TOKEN_KEY = 'smartdine.token'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'error',
    public details?: Record<string, string>,
  ) {
    super(message)
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/** Fires when the server rejects the stored token, so the app can sign out. */
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler = () => undefined
export const setUnauthorizedHandler = (fn: UnauthorizedHandler) => {
  onUnauthorized = fn
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Set for endpoints that are expected to 401 while signed out. */
  allowAnonymous?: boolean
}

/**
 * In-flight GETs, keyed by URL.
 *
 * Several contexts read the same public config on boot, and React's strict
 * mode runs each effect twice in development. Sharing the promise turns four
 * identical requests into one without any caching of stale data — the entry is
 * dropped as soon as the request settles.
 */
const inFlight = new Map<string, Promise<unknown>>()

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const method = options.method ?? 'GET'
  const key = `${method} ${url.toString()} ${getToken() ?? ''}`

  // Only reads are shareable; a POST must always reach the server.
  if (method === 'GET') {
    const pending = inFlight.get(key)
    if (pending) return pending as Promise<T>
  }

  const run = send<T>(url, options)
  if (method === 'GET') {
    inFlight.set(key, run)
    void run.catch(() => undefined).finally(() => inFlight.delete(key))
  }
  return run
}

async function send<T>(url: URL, options: RequestOptions): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?', 'network')
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({}) as Record<string, unknown>)

  if (!response.ok) {
    // A rejected token means the session is gone; drop it rather than looping.
    if (response.status === 401 && !options.allowAnonymous) {
      clearToken()
      onUnauthorized()
    }
    const body = payload as { error?: string; code?: string; details?: Record<string, string> }
    throw new ApiError(
      response.status,
      body.error ?? 'Something went wrong.',
      body.code ?? 'error',
      body.details,
    )
  }

  return payload as T
}

export const api = {
  get: <T,>(path: string, query?: RequestOptions['query']) => request<T>(path, { query }),
  post: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),

  /**
   * For endpoints a given role may legitimately not be allowed to read — the
   * super-admin-only feeds the console probes for on boot. Resolves to null
   * instead of throwing, and a 401 here does not discard the session.
   */
  probe: async <T,>(path: string, query?: RequestOptions['query']): Promise<T | null> => {
    if (!getToken()) return null
    try {
      return await request<T>(path, { query, allowAnonymous: true })
    } catch {
      return null
    }
  },
}

/** Turns any thrown value into a message safe to show a user. */
export function messageOf(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return fallback
}

/** Per-field errors from a 400, for forms that highlight individual inputs. */
export function fieldErrorsOf(err: unknown): Record<string, string> {
  return err instanceof ApiError && err.details ? err.details : {}
}

/** Downloads a file from an authenticated endpoint (report exports). */
export async function download(path: string, query: RequestOptions['query'], filename: string) {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const token = getToken()
  const response = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
  if (!response.ok) throw new ApiError(response.status, 'The export could not be generated.')

  const blob = await response.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}
