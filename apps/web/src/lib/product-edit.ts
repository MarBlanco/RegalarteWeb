/**
 * Editor comercial de productos (MODO EDICIÓN, storefront).
 *
 * Whitelist estricta de campos comerciales existentes en `Products`:
 * title, price, compareAtPrice, stock, soldOut, active, featured, category,
 * tags, description (solo párrafos simples), images (ids existentes).
 *
 * NUNCA expone: slug, precios/flags B2B, SEO, usuarios, roles, credenciales,
 * integraciones ni configuración técnica.
 *
 * - `lexicalToPlainText` / `isSimpleLexical`: la descripción es richText
 *   (Lexical). Solo se permite editar cuando el documento son párrafos
 *   simples sin formato; cualquier formato complejo queda solo-lectura para
 *   no destruirlo jamás.
 * - `sanitizeProductPatch`: valida y blanquea el cuerpo del PUT. Devuelve
 *   `null` si no hay ningún cambio válido.
 */

interface LexNode {
  type?: string
  text?: string
  format?: number
  children?: LexNode[]
}

export interface ProductPatchData {
  title?: string
  price?: number
  compareAtPrice?: number | null
  stock?: number
  soldOut?: boolean
  active?: boolean
  featured?: boolean
  category?: number
  tags?: number[]
  description?: Record<string, unknown>
  images?: number[]
  seoDescription?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  if (!t) return null
  return t.slice(0, max)
}

function cleanNumber(value: unknown, max = 999999999): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value)
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return n
}

function cleanId(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) return null
  return n
}

function cleanBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

/** ¿El doc Lexical son solo párrafos de texto sin formato? */
export function isSimpleLexical(doc: unknown): boolean {
  if (!isRecord(doc)) return false
  const root = doc.root
  if (!isRecord(root) || !Array.isArray(root.children)) return false
  if (root.children.length === 0) return true
  const walk = (node: unknown): boolean => {
    if (!isRecord(node)) return false
    if (typeof node.text === 'string') {
      return (node.format ?? 0) === 0
    }
    if (node.type === 'paragraph' || node.type === undefined) {
      return (
        Array.isArray(node.children) && node.children.every((c) => walk(c))
      )
    }
    if (node.type === 'linebreak') return true
    return false
  }
  return root.children.every((c) => walk(c))
}

function collectText(node: LexNode, out: string[]): void {
  if (typeof node.text === 'string') {
    out.push(node.text)
    return
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child.type === 'linebreak') out.push('\n')
      else collectText(child, out)
    }
  }
}

/** Extrae texto plano de un doc Lexical simple (párrafos separados). */
export function lexicalToPlainText(doc: unknown): string {
  if (!isRecord(doc)) return ''
  const root = doc.root
  if (!isRecord(root) || !Array.isArray(root.children)) return ''
  const paragraphs: string[] = []
  for (const child of root.children) {
    const out: string[] = []
    collectText(child as LexNode, out)
    paragraphs.push(out.join(''))
  }
  return paragraphs.join('\n\n').trim()
}

/** Construye un doc Lexical mínimo válido desde texto plano. */
export function plainTextToLexical(text: string): Record<string, unknown> {
  const blocks = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  const children = (
    blocks.length > 0 ? blocks : ['']
  ).map((p) => ({
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        mode: 'normal',
        text: p,
        type: 'text',
        style: '',
        detail: 0,
        format: 0,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
  }))
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr' as const,
    },
  }
}

/**
 * Valida el cuerpo del PUT de notas aromáticas (atributo).
 * Whitelist: solo `values` (lista de textos). Nunca nombre, slug ni flags.
 */
export function sanitizeAttributeValues(
  body: unknown,
): Array<{ value: string; sortOrder: number }> | null {
  if (!isRecord(body)) return null
  if (!Array.isArray(body.values)) return null
  const values: Array<{ value: string; sortOrder: number }> = []
  for (const v of body.values) {
    const text = typeof v === 'string' ? v : isRecord(v) ? v.value : null
    if (typeof text !== 'string') return null
    const t = text.trim().slice(0, 120)
    if (!t) continue
    if (values.length >= 12) break
    values.push({ value: t, sortOrder: values.length })
  }
  return values.length > 0 ? values : null
}

/**
 * Valida el cuerpo del PUT de producto. `baseDescription` es la descripción
 * actual en DB: solo se acepta `descriptionText` si el doc actual es simple.
 */
export function sanitizeProductPatch(
  body: unknown,
  baseDescription: unknown,
): ProductPatchData | null {
  if (!isRecord(body)) return null
  const patch: ProductPatchData = {}

  const title = body.title === undefined ? null : cleanText(body.title, 200)
  if (body.title !== undefined && title === null) return null
  if (title !== null) patch.title = title

  const price = body.price === undefined ? null : cleanNumber(body.price)
  if (body.price !== undefined && price === null) return null
  if (price !== null) patch.price = price

  if (body.compareAtPrice !== undefined) {
    if (body.compareAtPrice === null || body.compareAtPrice === '') {
      patch.compareAtPrice = null
    } else {
      const n = cleanNumber(body.compareAtPrice)
      if (n === null) return null
      patch.compareAtPrice = n
    }
  }

  const stock =
    body.stock === undefined ? null : cleanNumber(body.stock, 1000000)
  if (body.stock !== undefined) {
    if (stock === null || !Number.isInteger(stock)) return null
    patch.stock = stock
  }

  const active = body.active === undefined ? null : cleanBoolean(body.active)
  if (body.active !== undefined && active === null) return null
  if (active !== null) patch.active = active

  const soldOut =
    body.soldOut === undefined ? null : cleanBoolean(body.soldOut)
  if (body.soldOut !== undefined && soldOut === null) return null
  if (soldOut !== null) patch.soldOut = soldOut

  const featured =
    body.featured === undefined ? null : cleanBoolean(body.featured)
  if (body.featured !== undefined && featured === null) return null
  if (featured !== null) patch.featured = featured

  if (body.category !== undefined) {
    const id = cleanId(body.category)
    if (id === null) return null
    patch.category = id
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) return null
    const ids: number[] = []
    for (const t of body.tags) {
      const id = cleanId(t)
      if (id === null) return null
      if (!ids.includes(id)) ids.push(id)
    }
    patch.tags = ids
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) return null
    const ids: number[] = []
    for (const t of body.images) {
      const id = cleanId(t)
      if (id === null) return null
      if (!ids.includes(id)) ids.push(id)
    }
    patch.images = ids
  }

  if (body.descriptionText !== undefined) {
    if (typeof body.descriptionText !== 'string') return null
    if (!isSimpleLexical(baseDescription)) return null
    patch.description = plainTextToLexical(
      body.descriptionText.slice(0, 4000),
    )
  }

  if (body.seoDescription !== undefined) {
    if (typeof body.seoDescription !== 'string') return null
    const s = body.seoDescription.trim()
    if (s) patch.seoDescription = s.slice(0, 300)
  }

  return Object.keys(patch).length > 0 ? patch : null
}
