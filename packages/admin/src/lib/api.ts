export const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8787').replace(/\/$/, '')

let token = sessionStorage.getItem('admin-token') || ''
export const hasToken = () => !!token
export function setToken(t: string) {
  token = t
  if (t) sessionStorage.setItem('admin-token', t)
  else sessionStorage.removeItem('admin-token')
}

export class ApiError extends Error {
  status: number
  body: any
  constructor(message: string, status: number, body: any) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) }
  if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(API_BASE + path, { ...init, headers })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (res.status === 401 && token && path.startsWith('/api/admin')) {
    setToken('')
    window.dispatchEvent(new Event('admin-signed-out'))
  }
  if (!res.ok) throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body)
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ key: string; url: string }>('/api/admin/upload', { method: 'POST', body: form })
  }
}

// Uploaded files live in the site repo under /uploads. Until the site rebuilds they are only reachable on GitHub,
// so the admin previews them from there. Change VITE_RAW_BASE if your repo or branch differs.
const RAW_BASE = ((import.meta.env.VITE_RAW_BASE as string | undefined) || 'https://raw.githubusercontent.com/tanvir-005/tanvir-005.github.io/main/packages/web/public').replace(/\/$/, '')
export const mediaUrl = (v: string) => (v.startsWith('/uploads/') ? RAW_BASE + v : v)

export interface Entry {
  id: number
  type: string
  slug: string
  title: string
  summary: string
  body_md: string
  image: string
  date: string
  sort: number
  published: boolean
  data: Record<string, any>
}
