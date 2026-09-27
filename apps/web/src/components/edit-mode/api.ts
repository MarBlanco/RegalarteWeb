'use client'

/**
 * Cliente del endpoint de contenido de la Home (Modo Edición).
 * El token viaja en Authorization; el servidor verifica el JWT y el rol.
 */
export async function saveHomeContentPatch(
  patch: Record<string, unknown>,
  token: string,
): Promise<void> {
  const res = await fetch('/api/home-content', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const message =
      (data as { error?: string } | null)?.error ?? 'No se pudo guardar'
    throw new Error(message)
  }
}

/**
 * Avisa a las tiras de edición (ocultos) que refresquen su listado.
 */
export function notifyProductsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('products-changed'))
  }
}
 
/**
 * Cliente genérico de las rutas `/api/edit-mode/*` (MODO EDICIÓN).
 * Devuelve el JSON de respuesta o lanza con el `error` del servidor.
 */
export async function editModeRequest<T = {
  id?: number
  title?: string
  slug?: string
  deleted?: boolean
  deactivated?: boolean
}>(
  path: string,
  method: string,
  body: Record<string, unknown> | null,
  token: string,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await res.json().catch(() => null)) as {
    error?: string
  } | null
  if (!res.ok) throw new Error(data?.error ?? 'No se pudo guardar')
  return data as T
}
