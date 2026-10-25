'use client'

import { useEffect, useRef, useState } from 'react'

interface ClearCartDialogProps {
  open: boolean
  itemCount: number
  onClose: () => void
  onConfirm: () => void
}

/**
 * Confirmación antes de vaciar todo el carrito (panel lateral y página /cart).
 * Cancelar, Esc y el fondo no tocan el store. Esc en fase de captura para no
 * cerrar también el panel lateral que lo contiene.
 */
export function ClearCartDialog({ open, itemCount, onClose, onConfirm }: ClearCartDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    setConfirming(false)
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null

  function handleConfirm() {
    if (confirming) return
    setConfirming(true)
    onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2C221E]/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="clear-cart-title"
        aria-describedby="clear-cart-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-[#EBDFD1] bg-[#FFFDF9] p-5 shadow-xl sm:p-6"
      >
        <h2 id="clear-cart-title" className="font-serif text-xl font-normal text-[#38271D]">
          ¿Vaciar el carrito?
        </h2>
        <p id="clear-cart-desc" className="mt-3 text-sm leading-relaxed text-[#5C4A3D]">
          {itemCount === 1
            ? 'Vas a quitar el producto de tu carrito.'
            : `Vas a quitar los ${itemCount} productos de tu carrito.`}{' '}
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            ref={cancelRef}
            onClick={onClose}
            className="h-10 rounded-md border border-[#E5DDD1] text-[11px] font-semibold uppercase tracking-wider text-[#5C4A3D] transition-colors hover:border-[#C45A37]/60 hover:text-[#C45A37]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="h-10 rounded-md bg-[#B85C33] text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#9E4E2B] disabled:opacity-60"
          >
            Vaciar
          </button>
        </div>
      </div>
    </div>
  )
}
