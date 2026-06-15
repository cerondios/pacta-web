'use client'
import { useAppStore } from '@/store/useAppStore'

export function SearchBar() {
  const showToast = useAppStore((s) => s.showToast)

  return (
    <div className="flex items-center bg-white border border-g3 rounded-[40px] mx-5 my-2.5 shadow-[0_2px_14px_rgba(13,27,42,.08)] overflow-hidden">
      <div
        className="flex-1 px-4 py-2 border-r border-g3 cursor-pointer"
        onClick={() => showToast('Buscar ciudad…')}
      >
        <div className="text-[9px] font-bold uppercase tracking-[.5px] text-navy">Dónde</div>
        <div className="text-[13px] text-g1 mt-0.5">Explora ciudades</div>
      </div>
      <div
        className="flex-1 px-4 py-2 border-r border-g3 cursor-pointer"
        onClick={() => showToast('Seleccionar tipo…')}
      >
        <div className="text-[9px] font-bold uppercase tracking-[.5px] text-navy">Tipo</div>
        <div className="text-[13px] text-g1 mt-0.5">Cualquier tipo</div>
      </div>
      <div
        className="flex-1 px-4 py-2 cursor-pointer"
        onClick={() => showToast('Configurar precio…')}
      >
        <div className="text-[9px] font-bold uppercase tracking-[.5px] text-navy">Precio máx.</div>
        <div className="text-[13px] text-g1 mt-0.5">Sin límite</div>
      </div>
      <button
        className="w-10 h-10 rounded-full bg-teal text-white border-none text-base m-1.5 flex-shrink-0 shadow-[0_2px_10px_rgba(26,122,110,.3)] hover:bg-teal-l transition-colors"
        onClick={() => showToast('Buscando…')}
      >
        🔍
      </button>
    </div>
  )
}
