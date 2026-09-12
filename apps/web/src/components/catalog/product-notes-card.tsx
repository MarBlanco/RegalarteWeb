import Link from 'next/link'
import { MOCK_NOTES } from './pdp-mock'

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
 * Tarjeta "Notas aromáticas" del mock. Prioriza atributos reales del
 * producto (salida/corazón/fondo/ritual); si no existen, usa MOCK visual.
 */
export function ProductNotesCard({ attributes }: { attributes: NoteAttribute[] }) {
  const salida = findValues(attributes, 'salida') ?? MOCK_NOTES.salida
  const corazon = findValues(attributes, 'coraz', 'corazó') ?? MOCK_NOTES.corazon
  const fondo = findValues(attributes, 'fondo', 'base') ?? MOCK_NOTES.fondo
  const ritual = findValues(attributes, 'ritual', 'momento', 'uso')

  return (
    <aside
      aria-label="Notas aromáticas"
      className="rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] p-5"
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#38271D]">
        Notas aromáticas
      </h2>

      <dl className="mt-4 space-y-4">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A8A7A]">
            Salida
          </dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-[#5C4A3D]">{salida}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A8A7A]">
            Corazón
          </dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-[#5C4A3D]">{corazon}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A8A7A]">
            Fondo
          </dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-[#5C4A3D]">{fondo}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-[#EBDFD1] pt-4">
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
        <p className="mt-1.5 text-sm font-semibold text-[#38271D]">
          {ritual ? 'Ritual sugerido' : MOCK_NOTES.ritualTitle}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#5C4A3D]">
          {ritual ?? MOCK_NOTES.ritualText}
        </p>
      </div>

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
