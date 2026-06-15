import { clsx } from 'clsx'
import type { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, id, className, children, ...props }: Props) {
  return (
    <div className="mb-3.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] font-bold uppercase tracking-[.6px] text-navy mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'w-full px-3.5 py-3 rounded-[11px] border-[1.5px] border-g3 text-sm font-[family-name:var(--font-dm-sans)] text-navy bg-g4 outline-none cursor-pointer transition-all focus:border-teal',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
