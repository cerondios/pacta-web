import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: Props) {
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
      <input
        id={id}
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-[10px] border-[1.5px] text-sm text-navy bg-g4 outline-none transition-all',
          'focus:border-teal focus:bg-white focus:shadow-[0_0_0_3px_rgba(26,122,110,.1)]',
          error ? 'border-warm' : 'border-g3',
          className,
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-warm mt-1">{error}</p>}
      {hint && !error && <p className="text-[11px] text-g2 mt-1">{hint}</p>}
    </div>
  )
}
