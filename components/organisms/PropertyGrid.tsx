'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { propertiesApi, apiErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { PropertyCard } from '@/components/molecules'
import type { BackendProperty, PagedResult, PropertySearchParams } from '@/lib/types'

const PAGE_SIZE = 12

const CATEGORIES = [
  { value: '',          icon: '✨', label: 'Todos'        },
  { value: 'APARTMENT', icon: '🏢', label: 'Apartamentos' },
  { value: 'HOUSE',     icon: '🏠', label: 'Casas'        },
  { value: 'ROOM',      icon: '🛏️', label: 'Habitaciones' },
  { value: 'PARKING',   icon: '🅿️', label: 'Parqueaderos' },
]

type SortOption = { sortBy: PropertySearchParams['sort_by']; sortType: PropertySearchParams['sort_type']; label: string }
const SORT_OPTIONS: SortOption[] = [
  { sortBy: 'created_at',   sortType: 'DESC', label: 'Más recientes'         },
  { sortBy: 'monthly_rent', sortType: 'ASC',  label: 'Precio: menor a mayor' },
  { sortBy: 'monthly_rent', sortType: 'DESC', label: 'Precio: mayor a menor' },
  { sortBy: 'area',         sortType: 'DESC', label: 'Mayor área'             },
  { sortBy: 'bedrooms',     sortType: 'DESC', label: 'Más habitaciones'       },
]

function sortIndexFromParams(sortBy?: string, sortType?: string): number {
  const i = SORT_OPTIONS.findIndex(o => o.sortBy === sortBy && o.sortType === sortType)
  return i >= 0 ? i : 0
}

export function PropertyGrid() {
  const showToast    = useAppStore((s) => s.showToast)
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()

  // Read initial state from URL
  const urlType      = searchParams.get('type')      ?? ''
  const urlSortIdx   = sortIndexFromParams(searchParams.get('sort_by') ?? undefined, searchParams.get('sort_type') ?? undefined)
  const urlPets      = searchParams.get('allows_pets') === 'true'
  const urlPage      = Number(searchParams.get('page') ?? '0')

  const [result,     setResult]     = useState<PagedResult<BackendProperty> | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [type,       setType]       = useState(urlType)
  const [sortIdx,    setSortIdx]    = useState(urlSortIdx)
  const [allowsPets, setAllowsPets] = useState(urlPets)
  const [page,       setPage]       = useState(urlPage)

  const updateUrl = useCallback((patch: Record<string, string | number | boolean | undefined>) => {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === false) sp.delete(k)
      else sp.set(k, String(v))
    })
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const doFetch = useCallback((p: number) => {
    const { sortBy, sortType } = SORT_OPTIONS[sortIdx]
    const city = searchParams.get('city') ?? undefined
    setLoading(true)
    propertiesApi.search({
      city,
      type:        type        || undefined,
      sort_by:     sortBy,
      sort_type:   sortType,
      allows_pets: allowsPets  || undefined,
      page:        p,
      size:        PAGE_SIZE,
    })
      .then(setResult)
      .catch((err) => showToast(apiErrorMessage(err, 'Error al buscar propiedades.')))
      .finally(() => setLoading(false))
  }, [searchParams, type, sortIdx, allowsPets, showToast])

  useEffect(() => { doFetch(page) }, [doFetch, page])

  // Sync URL when city changes externally (nav search)
  const urlCity = searchParams.get('city')
  useEffect(() => {
    setPage(0)
    doFetch(0)
  }, [urlCity]) // eslint-disable-line

  const changeType = (v: string) => {
    setType(v); setPage(0)
    updateUrl({ type: v || undefined, page: undefined })
  }
  const changeSortIdx = (i: number) => {
    setSortIdx(i); setPage(0)
    const { sortBy, sortType } = SORT_OPTIONS[i]
    updateUrl({ sort_by: sortBy, sort_type: sortType, page: undefined })
  }
  const changeAllowsPets = () => {
    const next = !allowsPets
    setAllowsPets(next); setPage(0)
    updateUrl({ allows_pets: next || undefined, page: undefined })
  }
  const changePage = (p: number) => {
    setPage(p)
    updateUrl({ page: p > 0 ? p : undefined })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setType(''); setSortIdx(0); setAllowsPets(false); setPage(0)
    updateUrl({ type: undefined, sort_by: undefined, sort_type: undefined, allows_pets: undefined, page: undefined })
  }

  const hasFilters   = !!type || allowsPets
  const properties   = result?.content ?? []
  const totalPages   = result?.totalPages ?? 0
  const totalElements = result?.totalElements ?? 0

  return (
    <div>
      {/* Category + filter bar */}
      <div className="sticky top-[68px] z-50 bg-white border-b border-g3">
        <div className="max-w-[1100px] mx-auto flex items-center gap-0 px-5">
          <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1 py-3">
            {CATEGORIES.map((c) => {
              const active = type === c.value
              return (
                <button
                  key={c.value}
                  onClick={() => changeType(c.value)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border-none cursor-pointer transition-all flex-shrink-0 ${
                    active ? 'text-navy' : 'text-g1 hover:bg-g4 hover:text-navy'
                  }`}
                >
                  <span className="text-xl leading-none">{c.icon}</span>
                  <span className={`text-[11px] font-semibold whitespace-nowrap ${active ? 'border-b-2 border-navy pb-px' : ''}`}>
                    {c.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 border-l border-g3 pl-4 ml-2 flex-shrink-0">
            <button
              onClick={changeAllowsPets}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border cursor-pointer transition-all ${
                allowsPets ? 'bg-navy text-white border-navy' : 'bg-white text-g1 border-g3 hover:border-navy hover:text-navy'
              }`}
            >
              🐾 Mascotas
            </button>

            <select
              value={sortIdx}
              onChange={(e) => changeSortIdx(Number(e.target.value))}
              className="text-[12px] font-semibold text-navy border border-g3 rounded-xl px-3 py-2 bg-white outline-none cursor-pointer hover:border-navy transition-colors"
            >
              {SORT_OPTIONS.map((o, i) => (
                <option key={i} value={i}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mt-6 mb-5">
        {!loading && result && (
          <p className="text-[13px] text-g1">
            <span className="font-semibold text-navy">{totalElements}</span>{' '}
            {totalElements === 1 ? 'propiedad' : 'propiedades'}
            {searchParams.get('city') && <> en <strong>{searchParams.get('city')}</strong></>}
          </p>
        )}
        {hasFilters && !loading && (
          <button
            onClick={clearFilters}
            className="text-[12px] text-teal font-semibold underline cursor-pointer bg-transparent border-none"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden border border-g3/60 shadow-sm">
              <div className="aspect-[4/3] bg-g3" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-3 bg-g3 rounded w-2/3" />
                <div className="h-4 bg-g3 rounded w-full" />
                <div className="h-3 bg-g3 rounded w-1/2" />
                <div className="h-5 bg-g3 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🏚</p>
          <h3 className="text-[18px] font-semibold text-navy mb-2">Sin resultados</h3>
          <p className="text-[14px] text-g1">
            {searchParams.get('city')
              ? `No encontramos propiedades en "${searchParams.get('city')}".`
              : 'Intenta con otro filtro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => changePage(page - 1)}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border border-g3 text-[13px] font-semibold text-navy bg-white hover:border-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Anterior
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              const show = i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1
              const gap  = i > 0 && Math.abs(i - page) === 2 && i !== totalPages - 1
              if (!show) return null
              return (
                <button
                  key={i}
                  onClick={() => changePage(i)}
                  className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border ${
                    i === page
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-navy border-g3 hover:border-navy'
                  }`}
                >
                  {gap ? '…' : i + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => changePage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-xl border border-g3 text-[13px] font-semibold text-navy bg-white hover:border-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
