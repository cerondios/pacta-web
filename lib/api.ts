import type {
  AuthTokenResponse,
  ProfileResponse,
  RegisterRequest,
  OnboardingRequest,
  Property,
  PropertyFilters,
  PropertySearchParams,
  PagedResult,
  LandlordProperty,
  BackendProperty,
  UpdateDraftRequest,
  CreatePropertyRequest,
  Candidate,
  Notification,
  NotifRole,
  UploadedFile,
  KycRequest,
  KycResponse,
  ComplianceDocRequest,
  ComplianceDocResponse,
  ComplianceRequirement,
  BankAccountRequest,
  BankAccountResponse,
} from './types'
import { getTokenCookie } from './cookies'

/** Extracts the message from an API error thrown by `request()`. */
export function apiErrorMessage(err: unknown, fallback = 'Algo salió mal. Inténtalo de nuevo.'): string {
  return err instanceof Error && err.message ? err.message : fallback
}

declare const process: { env: Record<string, string | undefined> };
const BASE_URL = typeof window === 'undefined'
  ? (process.env.BACKEND_URL ?? 'http://localhost:8080')
  : ''

export class UnauthorizedError extends Error {
  constructor() { super('No autorizado. Por favor inicia sesión.') }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Token is the raw JWT — backend reads it as X-Pacta-Token (no "Bearer" prefix)
  const token = getTokenCookie()

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Pacta-Token': token } : {}),
      ...options?.headers,
    },
    ...options,
  })

  // A 401 on a public auth route (e.g. wrong/expired OTP) is a domain error
  // the caller should display inline — not a dead session to redirect away from.
  const isAuthRoute = path.startsWith('/api/auth/')

  if (res.status === 401 && !isAuthRoute) {
    if (typeof window !== 'undefined') {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/auth/login?redirect=${redirect}`
    }
    throw new UnauthorizedError()
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`)
  }

  // 202 / 204 responses have no body
  const text = await res.text()
  return text ? JSON.parse(text) : (undefined as unknown as T)
}

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  /**
   * Step 1 — POST /api/auth/login
   * Sends a 6-digit OTP to the given email.
   * Returns 202 with no body.
   */
  sendOtp(email: string): Promise<void> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  /**
   * Step 2 — POST /api/auth/verify
   * Exchanges a valid OTP for a signed JWT.
   * Returns { accessToken, tokenType, expiresIn }.
   */
  verifyOtp(email: string, code: string): Promise<AuthTokenResponse> {
    return request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  },

  /**
   * POST /api/auth/register
   * Creates a new user account and sends an OTP.
   * Returns 202 with no body.
   * Fields: email, fullName, roles (["TENANT"|"LANDLORD"]), phone?, country?
   */
  register(body: RegisterRequest): Promise<void> {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  /**
   * GET /api/me
   * Returns the authenticated user's full profile.
   */
  getProfile(): Promise<ProfileResponse> {
    return request('/api/me')
  },

  /**
   * POST /api/me/onboarding
   * One-time call — sets roles and city. Returns 409 if already done.
   */
  async completeOnboarding(body: OnboardingRequest): Promise<ProfileResponse> {
    const token = getTokenCookie()
    const res = await fetch(`${BASE_URL}/api/me/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Pacta-Token': token } : {}),
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const body2 = await res.json().catch(() => ({}))
      throw new Error(body2.message ?? body2.error ?? `HTTP ${res.status}`)
    }
    const freshToken = res.headers.get('X-Pacta-Token')
    if (freshToken) {
      const { setTokenCookie } = await import('./cookies')
      setTokenCookie(freshToken, 3600)
    }
    return res.json()
  },
}

// ── Properties ───────────────────────────────────────────
export const propertiesApi = {
  search(params?: PropertySearchParams) {
    const q = new URLSearchParams()
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
    })
    return request<PagedResult<BackendProperty>>(`/api/properties/search?${q}`)
  },
  list(filters?: Partial<PropertyFilters>) {
    const params = new URLSearchParams(
      Object.entries(filters ?? {}).filter(([, v]) => v !== undefined) as [string, string][],
    )
    return request<import('./types').BackendProperty[]>(`/api/properties?${params}`)
  },
  get(id: string) {
    return request<import('./types').BackendProperty>(`/api/properties/${id}`)
  },
  toggleFavorite(id: string) {
    return request<{ fav: boolean }>(`/api/properties/${id}/favorite`, { method: 'POST' })
  },
}

// ── Applications ─────────────────────────────────────────
export interface PropertyRequest {
  id: string
  tenant_id: string
  property_id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  applied_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export const applicationApi = {
  apply(propertyId: string) {
    return request<PropertyRequest>(`/api/properties/${propertyId}/apply`, { method: 'POST' })
  },
  myRequests() {
    return request<PropertyRequest[]>('/api/properties/my-requests')
  },
  listForProperty(propertyId: string) {
    return request<PropertyRequest[]>(`/api/properties/${propertyId}/requests`)
  },
  accept(requestId: string) {
    return request<void>(`/api/properties/requests/${requestId}/accept`, { method: 'POST' })
  },
  reject(requestId: string) {
    return request<void>(`/api/properties/requests/${requestId}/reject`, { method: 'POST' })
  },
}

// ── Candidates ───────────────────────────────────────────
export const candidatesApi = {
  list(propertyId: string) {
    return request<Candidate[]>(`/api/properties/${propertyId}/candidates`)
  },
  accept(candidateId: string) {
    return request<void>(`/api/candidates/${candidateId}/accept`, { method: 'POST' })
  },
  reject(candidateId: string) {
    return request<void>(`/api/candidates/${candidateId}/reject`, { method: 'POST' })
  },
}

// ── Notifications ─────────────────────────────────────────
export const notificationsApi = {
  list(role: NotifRole) {
    return request<Notification[]>(`/api/notifications?role=${role}`)
  },
  markRead(id: string) {
    return request<void>(`/api/notifications/${id}/read`, { method: 'PUT' })
  },
  markAllRead(role: NotifRole) {
    return request<void>(`/api/notifications/read-all?role=${role}`, { method: 'PUT' })
  },
}

// ── Files ─────────────────────────────────────────────────
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // keep in sync with spring.servlet.multipart.max-file-size

export const filesApi = {
  async upload(file: File): Promise<UploadedFile> {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`"${file.name}" pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. El máximo permitido es 10MB.`)
    }
    const token = getTokenCookie()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/files`, {
      method: 'POST',
      headers: token ? { 'X-Pacta-Token': token } : {},
      body: form,
    })
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.')
      }
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`)
    }
    return res.json()
  },

  async deleteFile(key: string): Promise<void> {
    const token = getTokenCookie()
    await fetch(`${BASE_URL}/api/files/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: token ? { 'X-Pacta-Token': token } : {},
    })
  },

  async getUrl(key: string): Promise<string> {
    const data: { url: string } = await request(`/api/files/url?key=${encodeURIComponent(key)}`)
    return data.url
  },

  async getUrls(keys: string[]): Promise<string[]> {
    return Promise.all(keys.map((k) => filesApi.getUrl(k)))
  },
}

// ── KYC ──────────────────────────────────────────────────
export const kycApi = {
  submit(body: KycRequest): Promise<KycResponse> {
    return request('/api/me/kyc', { method: 'POST', body: JSON.stringify(body) })
  },
  get(): Promise<KycResponse> {
    return request('/api/me/kyc')
  },
}

// ── Compliance ───────────────────────────────────────────
export const complianceApi = {
  getRequirements(): Promise<ComplianceRequirement[]> {
    return request('/api/me/documents')
  },
  submit(body: ComplianceDocRequest): Promise<ComplianceDocResponse> {
    return request('/api/me/documents', { method: 'POST', body: JSON.stringify(body) })
  },
  remove(docId: string): Promise<void> {
    return request(`/api/me/documents/${docId}`, { method: 'DELETE' })
  },
}

// ── Landlord ─────────────────────────────────────────────
export const landlordApi = {
  /** Creates a blank DRAFT — backend assigns the ID. */
  create(): Promise<BackendProperty> {
    return request('/api/properties', { method: 'POST' })
  },
  /** Partially updates a DRAFT property. */
  update(id: string, body: UpdateDraftRequest): Promise<BackendProperty> {
    return request(`/api/properties/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  },
  /** Submits a completed draft for publishing. */
  submit(id: string): Promise<BackendProperty> {
    return request(`/api/properties/${id}/submit`, { method: 'POST' })
  },
  /** Lists all properties owned by the current landlord. */
  getMyProperties(): Promise<BackendProperty[]> {
    return request('/api/properties')
  },
  /** Gets a single property by ID. */
  getProperty(id: string): Promise<BackendProperty> {
    return request(`/api/properties/${id}`)
  },
  /** Deletes (archives) a property. */
  restoreProperty(id: string): Promise<BackendProperty> {
    return request(`/api/properties/${id}/restore`, { method: 'POST' })
  },
  archiveProperty(id: string): Promise<BackendProperty> {
    return request(`/api/properties/${id}/archive`, { method: 'POST' })
  },
  deleteProperty(id: string): Promise<void> {
    return request(`/api/properties/${id}`, { method: 'DELETE' })
  },
}

// ── Property attribute configs (public) ──────────────────
export const propertyConfigsApi = {
  listEnabled(propertyType: string): Promise<import('./types').PropertyAttributeConfig[]> {
    return request(`/api/property-configs?propertyType=${encodeURIComponent(propertyType)}`)
  },
}

// ── Pricing ────────────────────────────────────────────────
export interface PricingBreakdown {
  monthly_rent: number
  commission_percentage: number
  pacta_fee: number
  landlord_receives: number
}

export const pricingApi = {
  getBreakdown(monthlyRent: number, country: string): Promise<PricingBreakdown> {
    return request(`/api/pricing/breakdown?monthly_rent=${monthlyRent}&country=${encodeURIComponent(country)}`)
  },
}

// ── Payments (direct bank transfer, via a payment gateway — currently Wompi/PSE) ──
export interface Bank {
  code: string
  name: string
}

export interface InitiatePaymentRequest {
  property_request_id: string
  bank_code: string
  payer_legal_id_type: string
  payer_legal_id: string
  payer_type: number
  customer_email: string
  redirect_url: string
}

export interface Payment {
  id: string
  property_request_id: string
  amount_in_cents: number
  currency: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED'
  redirect_url: string | null
  created_at: string
}

export const paymentApi = {
  getAvailableBanks(): Promise<Bank[]> {
    return request('/api/payments/banks')
  },
  initiate(body: InitiatePaymentRequest): Promise<Payment> {
    return request('/api/payments', { method: 'POST', body: JSON.stringify(body) })
  },
  myPayments(): Promise<Payment[]> {
    return request('/api/payments/my-payments')
  },
  get(id: string): Promise<Payment> {
    return request(`/api/payments/${id}`)
  },
  byDeal(dealId: string): Promise<Payment[]> {
    return request(`/api/payments/by-deal/${dealId}`)
  },
}

// ── Deals ("Mis negocios") ────────────────────────────────
export interface Deal {
  id: string
  property_request_id: string
  property_id: string
  landlord_id: string
  tenant_id: string
  status: 'PENDING_SIGNATURES' | 'ACTIVE'
  landlord_signed: boolean
  tenant_signed: boolean
  landlord_signed_at: string | null
  tenant_signed_at: string | null
  created_at: string
}

export const dealApi = {
  myDeals(): Promise<Deal[]> {
    return request('/api/deals/my-deals')
  },
  get(id: string): Promise<Deal> {
    return request(`/api/deals/${id}`)
  },
  getContractUrl(id: string): Promise<{ url: string }> {
    return request(`/api/deals/${id}/contract-url`)
  },
  sign(id: string, signatureName: string): Promise<Deal> {
    return request(`/api/deals/${id}/sign`, { method: 'POST', body: JSON.stringify({ signature_name: signatureName }) })
  },
}

// ── Banking ──────────────────────────────────────────────
export const bankingApi = {
  get(): Promise<BankAccountResponse[]> {
    return request('/api/me/bank-accounts')
  },
  add(body: BankAccountRequest): Promise<BankAccountResponse> {
    return request('/api/me/bank-accounts', { method: 'POST', body: JSON.stringify(body) })
  },
  remove(accountId: string): Promise<void> {
    return request(`/api/me/bank-accounts/${accountId}`, { method: 'DELETE' })
  },
}

// ── Users (public profile) ────────────────────────────────
export interface TenantDetail {
  id: string
  full_name: string
  country: string
  status: string
  score: number
  created_at: string
  kyc_status: string | null
  compliance: { type_code: string; status: string }[]
}

export const tenantApi = {
  get(id: string): Promise<TenantDetail> {
    return request(`/api/users/${id}`)
  },
}
