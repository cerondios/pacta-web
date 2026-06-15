'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'

export function PropertyDetailModal() {
  const { currentProperty: p, setCurrentProperty } = useAppStore()
  const router = useRouter()
  const isOpen = !!p

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setCurrentProperty(null)
    document.addEventListener('keydown', handler)
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, setCurrentProperty])

  if (!p) return null

  const tagLabel = p.type === 'arr' ? '🏠 ARRIENDO' : p.type === 'ven' ? '🏷 VENTA' : '🔧 SERVICIO'
  const tagColor = p.type === 'arr' ? 'bg-teal-xl text-teal' : p.type === 'ven' ? 'bg-[#FDE3E0] text-warm' : 'bg-g4 text-g1'

  return (
    <div
      className={`fixed inset-0 bg-black/55 z-[500] flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={() => setCurrentProperty(null)}
    >
      <div
        className="bg-white rounded-t-[22px] w-full max-w-[600px] max-h-[92vh] overflow-y-auto scrollbar-none transition-transform duration-[400ms] cubic-bezier(.4,0,.2,1)"
        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-g3 rounded-full mx-auto mt-2.5 cursor-pointer" onClick={() => setCurrentProperty(null)} />
        <button
          className="absolute top-3 right-4 w-7 h-7 rounded-full bg-g4 border-none text-base flex items-center justify-center cursor-pointer"
          onClick={() => setCurrentProperty(null)}
        >
          ✕
        </button>

        {/* Image */}
        <div className="h-[260px] overflow-hidden" style={{ background: p.color }} />

        {/* Body */}
        <div className="p-5">
          <div className="flex gap-1.5 flex-wrap mb-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tagColor}`}>{tagLabel}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E3F2FD] text-[#1565C0]">✓ VERIFICADO</span>
          </div>

          <h2 className="font-serif text-[22px] text-navy mb-1 leading-[1.2]">{p.name}</h2>
          <p className="text-[13px] text-g1 mb-4">📍 {p.hood}, {p.city}</p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {p.area > 0 && <Feat icon="📐" value={`${p.area}`} label="m²" />}
            {p.beds > 0 && <Feat icon="🛏" value={`${p.beds}`} label="Hab." />}
            {p.baths > 0 && <Feat icon="🚿" value={`${p.baths}`} label="Baños" />}
            <Feat icon="⭐" value={`${p.rating}`} label={`${p.reviews} reseñas`} />
            {p.type === 'arr' && <Feat icon="📅" value="Día 5" label="Garantizado" />}
            <Feat icon="✓" value={p.ownerScore} label="Score propietario" />
          </div>

          <div className="h-px bg-g3 my-3.5" />

          {/* Owner */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
            >
              {p.ownerAv}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-navy">{p.owner}</div>
              <div className="text-[11px] text-g1">{p.ownerSub}</div>
            </div>
            <span className="bg-teal-xl text-teal text-xs font-bold px-2.5 py-0.5 rounded-full">
              Score {p.ownerScore}
            </span>
          </div>

          <div className="h-px bg-g3 my-3.5" />

          <p className="text-[13px] text-g1 leading-[1.7] mb-3">{p.desc}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.amenities.map((a) => (
              <span key={a} className="px-2.5 py-1.5 rounded-full bg-g4 text-[11px] border border-g3">{a}</span>
            ))}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="flex items-center justify-between bg-white px-5 py-3 border-t border-g3 sticky bottom-0">
          <div>
            <div className="font-serif text-[20px] text-navy">{p.price}</div>
            <div className="text-[11px] text-g1">{p.priceL}</div>
          </div>
          <button
            className="px-6 py-3 rounded-full text-white text-sm font-bold border-none cursor-pointer shadow-[0_4px_14px_rgba(26,122,110,.3)] hover:-translate-y-0.5 transition-all"
            style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
            onClick={() => {
              setCurrentProperty(null)
              router.push(`/properties/${p.id}`)
            }}
          >
            Aplicar ahora →
          </button>
        </div>
      </div>
    </div>
  )
}

function Feat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-g4 rounded-[10px] p-2.5 text-center">
      <div className="text-[17px] mb-0.5">{icon}</div>
      <div className="text-xs font-bold text-navy">{value}</div>
      <div className="text-[10px] text-g1">{label}</div>
    </div>
  )
}
