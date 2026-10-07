'use client'

import { useEffect, useRef, useState } from 'react'

export interface MultiSelectOption {
  id: number
  label: string
}

/**
 * Desplegable de selección múltiple con el mismo aspecto que un `<select>`.
 * Cerrado muestra los valores elegidos ("Ámbar, Vainilla"); abierto lista
 * casillas para marcar y quitar. El panel va en el flujo (no flotante) para
 * que el contenedor con scroll del modal nunca lo recorte.
 */
export function MultiSelect({
  id,
  label,
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar…',
  emptyText = 'Sin opciones disponibles.',
}: Readonly<{
  id: string
  label: string
  options: MultiSelectOption[]
  selected: number[]
  onChange: (next: number[]) => void
  placeholder?: string
  emptyText?: string
}>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const chosen = options.filter((o) => selected.includes(o.id))
  const summary = chosen.length > 0 ? chosen.map((o) => o.label).join(', ') : placeholder

  function toggle(optionId: number) {
    onChange(
      selected.includes(optionId)
        ? selected.filter((s) => s !== optionId)
        : [...selected, optionId],
    )
  }

  return (
    <div
      ref={rootRef}
      className="space-y-1.5"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          // Cierra solo el desplegable, nunca el modal.
          e.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className={`truncate ${chosen.length === 0 ? 'text-muted-foreground' : ''}`}>
          {summary}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 text-[#7A6A5D] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={label}
          aria-multiselectable="true"
          className="max-h-44 space-y-0.5 overflow-y-auto rounded-md border border-[#E5DDD1] bg-white p-1.5 shadow-sm"
        >
          {options.length === 0 ? (
            <p className="px-2 py-1 text-xs text-[#7A6A5D]">{emptyText}</p>
          ) : (
            options.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#38271D] hover:bg-[#FBF7F1]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={() => toggle(o.id)}
                  className="h-4 w-4 accent-[#B85C33]"
                />
                {o.label}
              </label>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
