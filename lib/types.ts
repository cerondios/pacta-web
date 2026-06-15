// ── Auth ──────────────────────────────────────────────────
export interface User {
  id:        string
  fullName:  string
  email:     string
  roles:     string[]          // "TENANT" | "LANDLORD"
  status:    string
  score:     number
  phone?:    { indicative: string; number: string }
  country?:  string
  city?:     string
  createdAt?: string
}

// ── Properties ───────────────────────────────────────────
export type PropertyType = 'arr' | 'ven' | 'ser'
export type PropertyCategory =
  | 'apartamento'
  | 'casa'
  | 'estudio'
  | 'penthouse'
  | 'servicio'
  | 'pet'
  | 'parqueo'
  | 'habitacion'
  | 'amoblado'
  | 'piscina'
  | 'playa'
  | 'comercial'

export interface Property {
  id: number
  type: PropertyType
  city: string
  hood: string
  name: string
  beds: number
  baths: number
  area: number
  price: string
  priceL: string
  rating: number
  reviews: number
  badge?: string
  color: string
  cat: PropertyCategory
  desc: string
  amenities: string[]
  owner: string
  ownerSub: string
  ownerScore: string
  ownerAv: string
  fav: boolean
}

export interface PropertyFilters {
  type: PropertyType
  category: PropertyCategory | 'all'
  city?: string
  maxPrice?: number
}

export interface PagedResult<T> {
  content:       T[]
  page:          number
  size:          number
  totalElements: number
  totalPages:    number
}

export interface PropertySearchParams {
  city?:                string
  neighborhood?:        string
  country?:             string
  type?:                string
  currency?:            string
  min_rent?:            number
  max_rent?:            number
  min_area?:            number
  max_area?:            number
  min_bedrooms?:        number
  min_bathrooms?:       number
  min_floors?:          number
  min_parking_spots?:   number
  allows_pets?:         boolean
  allows_smokers?:      boolean
  allows_children?:     boolean
  min_contract_months?: number
  max_contract_months?: number
  amenity?:             string
  sort_by?:             'monthly_rent' | 'area' | 'bedrooms' | 'created_at'
  sort_type?:           'ASC' | 'DESC'
  page?:                number
  size?:                number
}

// ── Application flow ─────────────────────────────────────
export interface ApplicationData {
  propertyId: number
  fullName: string
  cedula: string
  birthDate: string
  phone: string
  employmentStatus: string
  monthlyIncome: string
  selectedBankId?: string
  biometricVerified: boolean
  score?: number
}

export interface ScoreBreakdown {
  bankFlow: number
  paymentHistory: number
  legalBackground: number
  jobStability: number
  incomeRatio: number
}

// ── Candidates (Dashboard) ────────────────────────────────
export type ScoreClass = 'high' | 'mid' | 'low'

export interface FinancialInfo {
  ingreso: string
  ingresoSub: string
  relacion: string
  relacionSub: string
  cuentas: string
  cuentasSub: string
  deudas: string
  deudasSub: string
  ahorros: string
  ahorrosSub: string
  antiguedad: string
  antiguedadSub: string
}

export interface RentHistory {
  addr: string
  period: string
  ok: boolean
  label: string
}

export interface VerifyStep {
  icon: string
  title: string
  time: string
  detail: string
}

export interface Candidate {
  id: number
  name: string
  initials: string
  color: string
  age: number
  job: string
  salary: number
  score: number
  scoreClass: ScoreClass
  rankLabel: string
  badges: ('verified' | 'ob' | 'bio')[]
  meta: string
  isNew: boolean
  scoreBreakdown: { label: string; val: number; cls: ScoreClass }[]
  fin: FinancialInfo
  obData: number[]
  rentHist: RentHistory[]
  histSub: string
  verifySteps: VerifyStep[]
}

// ── Notifications ─────────────────────────────────────────
export type NotifRole = 'arr' | 'prop'

export interface Notification {
  id: number
  icon: string
  bg: string
  unread: boolean
  title: string
  desc: string
  time: string
  btn: string
  btnCls: string
  dTitle: string
  dDesc: string
  dBtn: string
  dBtnS: string
}

// ── API responses ─────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// ── Auth request/response shapes (match backend snake_case exactly) ──

export interface RegisterRequest {
  email:     string
  full_name: string
  phone?:    { indicative: string; number: string }
  country?:  string
  // roles intentionally omitted — set during onboarding
}

export interface OnboardingRequest {
  roles: ('TENANT' | 'LANDLORD')[]
  city:  string
}

/** POST /api/auth/verify */
export interface AuthTokenResponse {
  access_token: string
  token_type:   string
  expires_in:   number
}

/** GET /api/profile — all keys snake_case (Jackson SNAKE_CASE strategy) */
export interface ProfileResponse {
  id:         string
  full_name:  string
  email:      string
  phone?:     { indicative: string; number: string }
  country?:   string
  city?:      string
  roles:      string[]
  status:     string
  score:      number
  created_at: string
}

// ── Landlord ──────────────────────────────────────────────
export type PropertyStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED' | 'RENTED'

export interface LandlordProperty extends Property {
  status:          PropertyStatus
  views:           number
  candidatesCount: number
  createdAt:       string
}

/** Matches PropertyResponse from the backend (Jackson SNAKE_CASE global strategy). */
export interface BackendProperty {
  id:                  string
  landlord_id:         string
  status:              string
  title:               string | null
  country:             string | null
  city:                string | null
  neighborhood:        string | null
  address:             string | null
  type:                string | null
  area:                number | null
  area_unit:           string | null
  bedrooms:            number | null
  bathrooms:           number | null
  floors:              number | null
  parking_spots:       number | null
  amenities:           string[]
  photo_keys:          string[]
  photo_urls:          string[]
  description:         string | null
  monthly_rent:        number | null
  currency:            string | null
  admin_fee:           number | null
  min_contract_months: number | null
  allows_pets:         boolean
  allows_smokers:      boolean
  allows_children:     boolean
  missing_publish_fields: string[]
  created_at:          string
  updated_at:          string | null
}

/** UpdatePropertyRequest body sent from the frontend (snake_case). */
export interface UpdateDraftRequest {
  type?:               string
  title?:              string
  country?:            string
  city?:               string
  neighborhood?:       string
  address?:            string
  area?:               number
  area_unit?:          string
  bedrooms?:           number | null
  bathrooms?:          number | null
  floors?:             number | null
  parking_spots?:      number
  amenities?:          string[]
  photo_keys?:         string[]
  description?:        string
  monthly_rent?:       number
  currency?:           string
  admin_fee?:          number
  min_contract_months?: number
  allows_pets?:        boolean
  allows_smokers?:     boolean
  allows_children?:    boolean
}

export interface CreatePropertyRequest {
  type:      PropertyType
  name:      string
  city:      string
  hood:      string
  cat:       PropertyCategory
  beds:      number
  baths:     number
  area:      number
  floors?:   number
  price:     string
  currency:  string
  desc:      string
  amenities: string[]
  photoUrls: string[]
}

// ── Storage ───────────────────────────────────────────────
export interface UploadedFile {
  url: string
  key: string
}

// ── KYC ──────────────────────────────────────────────────
export type DocumentStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export interface KycRequest {
  front_key: string
  rear_key:  string
  selfie_key: string
}

export interface KycResponse {
  id:           string
  user_id:      string
  front_key:    string
  rear_key:     string
  selfie_key:   string
  status:       DocumentStatus
  submitted_at: string
}

// ── Compliance requirements (per country) ────────────────
export interface ComplianceRequirement {
  type_code:    string
  display_name: string
  country_code: string
  status:       DocumentStatus | 'NOT_SUBMITTED'
  doc_id:       string | null
  expires_at:   string | null
}

// ── Compliance documents ──────────────────────────────────
export type DocumentType =
  | 'ANTECEDENTES'
  | 'SANCIONES'
  | 'INHABILIDADES'
  | 'HISTORIAL_CREDITICIO'

export interface ComplianceDocRequest {
  type_code: string
  key:       string
  issued_at: string
}

export interface ComplianceDocResponse {
  id:           string
  user_id:      string
  type_code:    string
  key:          string
  issued_at:    string
  expires_at:   string
  status:       DocumentStatus
  expired:      boolean
  submitted_at: string
}

// ── Banking ───────────────────────────────────────────────
export type AccountType = 'SAVINGS' | 'CHECKING'

export interface BankAccountRequest {
  bank_name:      string
  account_number: string
  account_type:   AccountType
  holder_name:    string
}

export interface BankAccountResponse {
  id:             string
  bank_name:      string
  account_number: string
  account_type:   AccountType
  holder_name:    string
}

// ── Property attribute configs ────────────────────────────
export interface PropertyAttributeConfig {
  id:            string
  property_type: string
  category:      string
  display_name:  string
  enabled:       boolean
}
