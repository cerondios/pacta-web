'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { Toast } from '@/components/atoms/Toast'
import { tenantApi, apiErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { TenantDetail } from '@/lib/api'

const STATUS_COLOR: Record<string, string> = {
  COMPLETED:    'text-green-700 bg-green-50 border-green-200',
  ACTIVE:       'text-blue-700 bg-blue-50 border-blue-200',
  PENDING_KYC:  'text-yellow-700 bg-yellow-50 border-yellow-200',
  BLOCKED:      'text-red-700 bg-red-50 border-red-200',
}

const DOC_STATUS_COLOR: Record<string, string> = {
  APPROVED:       'text-green-700 bg-green-50',
  PENDING_REVIEW: 'text-yellow-700 bg-yellow-50',
  REJECTED:       'text-red-700 bg-red-50',
}

function ScoreRing({ score }: { score: number }) {
  const pct   = score / 100
  const r     = 44
  const circ  = 2 * Math.PI * r
  const dash  = pct * circ
  const color = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="var(--g3)" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-serif text-2xl leading-none" style={{ color }}>{score}</span>
        <span className="text-[10px] text-g1">/ 100</span>
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  const { id }       = useParams<{ id: string }>()
  const router    = useRouter()
  const showToast = useAppStore((s) => s.showToast)
  const [tenant, setTenant]   = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tenantApi.get(id)
      .then(setTenant)
      .catch((err) => {
        showToast(apiErrorMessage(err, 'No se pudo cargar el perfil.'))
        router.back()
      })
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--sand)' }}>
        <AppNav minimal />

        {loading || !tenant ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="max-w-[1100px] mx-auto w-full px-6 py-8">

            {/* Back */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-g1 hover:text-navy transition-colors mb-6 bg-transparent border-none cursor-pointer p-0"
            >
              ← Volver
            </button>

            {/* Hero card */}
            <div className="bg-white rounded-2xl border border-g3 p-6 shadow-[0_2px_16px_rgba(13,27,42,.06)] mb-5">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {tenant.full_name?.slice(0, 2).toUpperCase() ?? '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-serif text-2xl text-navy mb-0.5">{tenant.full_name}</h1>
                  <p className="text-xs text-g2 mt-0.5">
                    Miembro desde {new Date(tenant.created_at).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ScoreRing score={tenant.score} />
                  <span className="text-xs font-semibold text-g1">Score Pacta</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-g3 flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[tenant.status] ?? 'text-g1 bg-g4 border-g3'}`}>
                  {tenant.status}
                </span>
                <span className="text-xs text-g1">🌎 {tenant.country}</span>
              </div>
            </div>

            {/* KYC + Compliance */}
            <div className="bg-white rounded-2xl border border-g3 p-5 shadow-[0_2px_16px_rgba(13,27,42,.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-navy">Verificación KYC</span>
                {tenant.kyc_status ? (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DOC_STATUS_COLOR[tenant.kyc_status] ?? 'text-g1 bg-g4'}`}>
                    {tenant.kyc_status === 'APPROVED' ? '✓ Verificado' : tenant.kyc_status === 'PENDING_REVIEW' ? 'En revisión' : 'Rechazado'}
                  </span>
                ) : (
                  <span className="text-xs text-g2">Sin verificación</span>
                )}
              </div>

              {tenant.compliance.length > 0 && (
                <>
                  <div className="text-sm font-bold text-navy mb-3">Documentos</div>
                  <div className="flex flex-col gap-0">
                    {tenant.compliance.map((d) => (
                      <div key={d.type_code} className="flex items-center justify-between py-2 border-b border-g3 last:border-0">
                        <span className="text-sm text-navy">{d.type_code.replace(/_/g, ' ')}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOC_STATUS_COLOR[d.status] ?? 'text-g1 bg-g4'}`}>
                          {d.status === 'APPROVED' ? '✓ Aprobado' : d.status === 'PENDING_REVIEW' ? 'En revisión' : 'Rechazado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <Toast />
    </AuthGuard>
  )
}
