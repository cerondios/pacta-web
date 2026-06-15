'use client'
import { useAppStore } from '@/store/useAppStore'

export function Toast() {
  const { message, visible } = useAppStore((s) => s.toast)

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-7 left-1/2 bg-[rgba(13,27,42,.94)] text-white px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap z-[9999] pointer-events-none transition-all duration-300"
      style={{
        transform: `translateX(-50%) translateY(${visible ? '0px' : '14px'})`,
        opacity: visible ? 1 : 0,
      }}
    >
      {message}
    </div>
  )
}
