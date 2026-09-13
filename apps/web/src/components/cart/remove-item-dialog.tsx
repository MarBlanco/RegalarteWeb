'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export interface ConfirmRemoveItem {
  id: string
  name: string
  image: { url?: string | null; alt?: string | null } | null
}

interface RemoveItemDialogProps {
  item: ConfirmRemoveItem | null
  onClose: () => void
  onConfirm: (id: string) => void
}

/**
 * Confirmación antes de eliminar una línea del carrito.
 * Solo se monta cuando hay un item pendiente; Cancelar no toca el store.
 */
export function RemoveItemDialog({ item, onClose, onConfirm }: RemoveItemDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setConfirming(false)
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [item?.id, onClose])

  if (!item) return null

  function handleConfirm() {
    if (confirming) return
    setConfirming(true)
    onConfirm(item!.id)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2C221E]/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-item-title"
        aria-describedby="remove-item-desc"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-[#EBDFD1] bg-[#FFFDF9] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="remove-item-title"
            className="font-serif text-xl font-normal text-[#38271D]"
          >
            ¿Eliminar producto?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#7A6A5D] transition-colors hover:bg-[#F3EADB] hover:text-[#38271D]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#F4EDE4]">
            {item.image?.url ? (
              <Image
                src={item.image.url}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : null}
          </span>
          <p id="remove-item-desc" className="text-sm leading-relaxed text-[#5C4A3D]">
            ¿Querés eliminar “{item.name}” de tu carrito?
          </p>
        </div>

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
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
