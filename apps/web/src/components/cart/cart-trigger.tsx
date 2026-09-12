'use client'

import { selectItemCount, useCartStore } from '@/lib/cart'
import { useCartUIStore } from '@/lib/cart/ui-store'
import { cn } from '@/lib/utils'

export interface CartTriggerProps {
  className?: string
  /** Clases aplicadas al badge contador. */
  badgeClassName?: string
}

/**
 * Botón-disparador del drawer del carrito.
 * Muestra contador en tiempo real, adaptado para evitar hydration mismatch
 * (muestra 0 hasta que la rehidratacion localStorage del store termine).
 */
export function CartTrigger({ className, badgeClassName }: CartTriggerProps) {
  const open = useCartUIStore((s) => s.open)
  const itemCount = useCartStore(selectItemCount)
  const hydrated = useCartStore((s) => s.hydrated)

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Carrito (${
        hydrated ? itemCount : 0
      } productos)`}
      className={cn('relative inline-flex', className)}
    >
      <span className="flex h-8 w-8 items-center justify-center text-[#38271D] transition-colors hover:text-[#C45A37] sm:h-9 sm:w-9">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px] sm:h-5 sm:w-5"
          aria-hidden
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      </span>
      <span
        aria-hidden
        className={cn(
          'absolute right-0 top-0 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#A15C38] px-1 text-[10px] font-semibold leading-4 text-white',
          badgeClassName,
        )}
      >
        {!hydrated ? 0 : itemCount > 99 ? '99+' : itemCount}
      </span>
    </button>
  )
}
