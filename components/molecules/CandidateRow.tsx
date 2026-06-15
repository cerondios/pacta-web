'use client'
import type { Candidate } from '@/lib/types'
import { clsx } from 'clsx'

const rankColors = ['text-[#F59E0B]', 'text-g2', 'text-[#B45309]']
const rankNums   = ['1°', '2°', '3°', '4°', '5°']

const scoreColor: Record<string, string> = {
  high: 'text-success',
  mid:  'text-warning',
  low:  'text-danger',
}

interface Props {
  candidate: Candidate
  rank: number
  isActive: boolean
  onClick: () => void
}

export function CandidateRow({ candidate: c, rank, isActive, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2.5 px-4 py-3 border-b border-g4 text-left transition-colors duration-150 relative',
        isActive ? 'bg-teal-xl before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-teal before:rounded-r-sm' : 'hover:bg-sand',
      )}
    >
      <span className={clsx('w-5 text-center text-[11px] font-bold flex-shrink-0', rankColors[rank] ?? 'text-g2')}>
        {rankNums[rank] ?? `${rank + 1}°`}
      </span>

      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0 relative"
        style={{ background: c.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-navy truncate">{c.name}</div>
        <div className="text-[11px] text-g1">{c.job} · {c.age} años</div>
      </div>

      <div className="flex-shrink-0 text-center">
        <div className={clsx('font-serif text-[19px] leading-none', scoreColor[c.scoreClass])}>{c.score}</div>
        <div className="text-[9px] font-bold uppercase tracking-[.5px] text-g2 mt-0.5">Score</div>
      </div>

      {c.isNew && (
        <span className="absolute top-2 right-4 bg-warm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
          NUEVO
        </span>
      )}
    </button>
  )
}
