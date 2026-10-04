/**
 * Devuelve `url` solo si es seguro usarla como `src` de una imagen:
 * ruta relativa al sitio, o esquema http/https/blob. Cualquier otro
 * esquema (javascript:, data:, etc.) o valor inválido devuelve undefined.
 */
export function safeImageSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) return url
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:' || protocol === 'blob:'
      ? url
      : undefined
  } catch {
    return undefined
  }
}
