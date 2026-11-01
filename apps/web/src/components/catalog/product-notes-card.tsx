import Link from 'next/link'

export interface NoteAttribute {
  name: string
  values: string[]
}

function findValues(attrs: NoteAttribute[], ...needles: string[]): string | null {
  for (const attr of attrs) {
    const name = attr.name.toLowerCase()
    if (needles.some((n) => name.includes(n))) {
      const joined = attr.values.filter(Boolean).join(', ')
      if (joined) return joined
    }
  }
  return null
}

/**
 * Tarjeta "Notas aromáticas". Muestra únicamente atributos reales del producto
 * (salida/corazón/fondo/ritual): nunca texto de relleno, porque describiría un aroma
 * que el producto no tiene. Sin ningún dato real, la tarjeta no se muestra.
 */
export function ProductNotesCard({ attributes }: { attributes: NoteAttribute[] }) {
  const notes = [
    { label: 'Salida', value: findValues(attributes, 'salida') },
    { label: 'Corazón', value: findValues(attributes, 'coraz', 'corazó') },
    { label: 'Fondo', value: findValues(attributes, 'fondo', 'base') },
  ].filter((n): n is { label: string; value: string } => n.value !== null)
  const ritual = findValues(attributes, 'ritual', 'momento', 'uso')

  if (notes.length === 0 && !ritual) return null

  return (
    <aside
      aria-label="Notas aromáticas"
      className="rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] p-5"
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#38271D]">
        Notas aromáticas
      </h2>

      {notes.length > 0 ? (
        <dl className="mt-4 space-y-4">
          {notes.map((note) => (
            <div key={note.label}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A8A7A]">
                {note.label}
              </dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[#5C4A3D]">{note.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {ritual ? (
        <div className="mt-5 border-t border-[#EBDFD1] pt-4 first:mt-4 first:border-t-0 first:pt-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B85C33]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
            </svg>
            Ritual sugerido
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#5C4A3D]">{ritual}</p>
        </div>
      ) : null}

      <Link
        href="#detalles"
        className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B85C33] hover:text-[#9E4E2B]"
      >
        Ver más sobre el aroma
        <span aria-hidden="true">→</span>
      </Link>
    </aside>
  )
}
