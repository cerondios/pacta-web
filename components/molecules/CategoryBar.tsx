'use client'
import { useAppStore } from '@/store/useAppStore'
import { CATEGORIES } from '@/lib/data/properties'
import type { PropertyType } from '@/lib/types'

interface Props {
  tab: PropertyType
}

export function CategoryBar({ tab }: Props) {
  const { activeCategory, setActiveCategory } = useAppStore()
  const cats = CATEGORIES[tab] ?? []

  return (
    <div className="flex items-center px-5 pb-2.5 border-b border-g3">
      <div className="flex gap-0 overflow-x-auto scrollbar-none flex-1">
        {/* All */}
        <button
          className={`flex flex-col items-center gap-[3px] px-3.5 pb-2 cursor-pointer flex-shrink-0 border-b-2 transition-all duration-200 bg-transparent
            ${activeCategory === 'all' ? 'opacity-100 border-navy' : 'opacity-60 border-transparent hover:opacity-100'}`}
          onClick={() => setActiveCategory('all')}
        >
          <span className="text-xl">✨</span>
          <span className="text-[10px] font-semibold text-navy">Todos</span>
        </button>

        {cats.map((c) => (
          <button
            key={c.val + c.label}
            className={`flex flex-col items-center gap-[3px] px-3.5 pb-2 cursor-pointer flex-shrink-0 border-b-2 transition-all duration-200 bg-transparent
              ${activeCategory === c.val ? 'opacity-100 border-navy' : 'opacity-60 border-transparent hover:opacity-100'}`}
            onClick={() => setActiveCategory(c.val)}
          >
            <span className="text-xl">{c.icon}</span>
            <span className="text-[10px] font-semibold text-navy">{c.label}</span>
          </button>
        ))}
      </div>

      <button
        className="flex items-center gap-1.5 border border-g3 rounded-[9px] px-3 py-2 bg-transparent text-xs font-semibold text-navy flex-shrink-0 ml-3 hover:border-navy transition-colors"
        onClick={() => useAppStore.getState().showToast('Filtros avanzados')}
      >
        ⊞ Filtros
      </button>
    </div>
  )
}
