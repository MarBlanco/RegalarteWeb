'use client'

import Link from 'next/link'
import { useEditMode, useIsAdmin, useIsStaff } from '@/hooks/use-edit-mode'
import { PencilIcon } from './edit-button'

function EyeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ShieldIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Z" />
    </svg>
  )
}

/**
 * Selector de modo (solo staff/admin autenticados): dos botones juntos,
 * [MODO EDICIÓN] [MODO CLIENTE]. El seleccionado se destaca, el otro es
 * neutro. Reutiliza `viewAsClient`; los clientes nunca ven la barra.
 *
 * Solo ADMIN ve además el botón "Administrar" (panel /admin). STAFF no lo
 * ve ni puede entrar: `access.admin` lo restringe a admin en el backend.
 */
export function EditModeBar() {
  const isStaff = useIsStaff()
  const isAdmin = useIsAdmin()
  const viewAsClient = useEditMode((s) => s.viewAsClient)
  const setViewAsClient = useEditMode((s) => s.setViewAsClient)

  if (!isStaff) return null

  const editing = !viewAsClient
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs'
  const selected = 'bg-[#B85C33] text-white shadow-sm'
  const neutral = 'text-[#5A3A28] hover:bg-[#EFDCC2]'

  return (
    <div className="w-full bg-[#F6E9D8] text-[#5A3A28]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-2 sm:px-6">
        <div
          role="group"
          aria-label="Modo de visualización"
          className="inline-flex items-center gap-1 rounded-full border border-[#C9A24B]/60 bg-white/40 p-1"
        >
          <button
            type="button"
            onClick={() => setViewAsClient(false)}
            aria-pressed={editing}
            className={`${base} ${editing ? selected : neutral}`}
          >
            <PencilIcon />
            Modo edición
          </button>
          <button
            type="button"
            onClick={() => setViewAsClient(true)}
            aria-pressed={viewAsClient}
            className={`${base} ${viewAsClient ? selected : neutral}`}
          >
            <EyeIcon />
            Modo cliente
          </button>
        </div>
        {isAdmin ? (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#B85C33] bg-[#B85C33] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#9E4E2B] sm:text-xs"
          >
            <ShieldIcon />
            Administrar
          </Link>
        ) : null}
      </div>
    </div>
  )
}
