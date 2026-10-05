import { notFound } from 'next/navigation'

/**
 * Captura toda ruta no definida dentro del storefront para renderizar
 * `not-found.tsx` con el layout de la tienda (header/footer, lang="es")
 * y status 404, en lugar del 404 genérico de Next.
 */
export default function CatchAllNotFound() {
  notFound()
}
