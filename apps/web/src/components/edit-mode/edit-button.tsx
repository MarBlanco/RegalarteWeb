'use client'

import { useEditActive } from '@/hooks/use-edit-mode'

export function PencilIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

export function TrashIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

interface EditButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

/**
 * Botón "Editar" del Modo Edición. Solo se renderiza cuando el Modo
 * Edición está activo (staff/admin autenticado, sin "ver como cliente").
 * Los clientes nunca lo ven.
 */
export function EditButton({ onClick, label = 'Editar', className = '' }: EditButtonProps) {
  const active = useEditActive()
  if (!active) return null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5C9A8] bg-[#F9EFE2] px-2.5 py-1 text-[11px] font-medium text-[#8A5A33] shadow-sm transition-colors hover:bg-[#F3E2CC] ${className}`}
      aria-label={label}
    >
      <PencilIcon />
      {label}
    </button>
  )
}
