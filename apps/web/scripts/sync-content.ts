/**
 * Sync DEV → PROD de contenido (solo datos editoriales del catálogo).
 *
 * Uso:
 *   npm run sync:content -- --source <uri> --dest <uri> [--apply] [--confirm-prod]
 *
 * - Por defecto es DRY-RUN: muestra el plan y no escribe nada.
 * - Destino no-local exige --confirm-prod explícito.
 * - Nunca borra, nunca toca usuarios/órdenes/medios/imágenes.
 * - PAYLOAD_SECRET: de env o de apps/web/.env.local (solo init local).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getPayload } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { parseArgs, prodGuard, SYNCED_GLOBALS, type Rec } from '@/lib/content-sync/plan'
import {
  computePlan,
  applyPlan,
  type ExportData,
  type SyncClient,
} from '@/lib/content-sync/apply'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

function fail(message: string): never {
  console.error(`sync:content: ${message}`)
  process.exit(2)
}

function ensureSecret(): string {
  if (process.env.PAYLOAD_SECRET) return process.env.PAYLOAD_SECRET
  try {
    const here = path.dirname(fileURLToPath(import.meta.url))
    const raw = readFileSync(path.join(here, '..', '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*PAYLOAD_SECRET\s*=\s*(.*)\s*$/)
      if (m) {
        const v = m[1].trim().replace(/^"|"$/g, '')
        if (v) {
          process.env.PAYLOAD_SECRET = v
          return v
        }
      }
    }
  } catch {
    /* sin .env.local */
  }
  fail('Falta PAYLOAD_SECRET (env o apps/web/.env.local)')
}

async function makePayload(uri: string, key: string): Promise<PayloadInstance> {
  const mod = (await import('../src/payload.config')) as {
    default: unknown
  }
  const base = (await mod.default) as Record<string, unknown>
  const config = {
    ...base,
    db: postgresAdapter({ pool: { connectionString: uri } }),
  }
  return getPayload({ config: config as never, key })
}

async function allDocs(
  payload: PayloadInstance,
  collection: string,
  where?: Record<string, unknown>,
): Promise<Rec[]> {
  const found = await payload.find({
    collection: collection as never,
    where: where as never,
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  } as never)
  return (found.docs ?? []) as unknown as Rec[]
}

async function readGlobals(
  payload: PayloadInstance,
  slugs: readonly string[],
): Promise<Record<string, Rec | null>> {
  const out: Record<string, Rec | null> = {}
  for (const g of slugs) {
    out[g] = (await payload
      .findGlobal({ slug: g as never, overrideAccess: true, depth: 0 } as never)
      .catch(() => null)) as unknown as Rec | null
  }
  return out
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2))
  if ('error' in parsed) fail(parsed.error)
  const args = parsed as Exclude<typeof parsed, { error: string }>
  const guard = prodGuard(args)
  if (guard) fail(guard)

  ensureSecret()
  const source = await makePayload(args.source, 'sync-source')

  // Modo export: vuelca el origen a JSON sin leer/escribir destino.
  if (args.exportFile) {
    const src: ExportData = {
      categories: await allDocs(source, 'categories', { active: { equals: true } }),
      tags: await allDocs(source, 'product-tags', { active: { equals: true } }),
      attributes: await allDocs(source, 'product-attributes', {
        active: { equals: true },
      }),
      products: await allDocs(source, 'products', { active: { equals: true } }),
      globals: await readGlobals(source, SYNCED_GLOBALS),
    }
    const { writeFileSync } = await import('node:fs')
    writeFileSync(args.exportFile, JSON.stringify(src))
    console.log(
      `export: ${src.categories.length} categorías, ${src.tags.length} tags, ` +
        `${src.attributes.length} atributos, ${src.products.length} productos → ${args.exportFile}`,
    )
    process.exit(0)
  }

  const dest = await makePayload(args.dest, 'sync-dest')

  const src: ExportData = {
    categories: await allDocs(source, 'categories', { active: { equals: true } }),
    tags: await allDocs(source, 'product-tags', { active: { equals: true } }),
    attributes: await allDocs(source, 'product-attributes', {
      active: { equals: true },
    }),
    products: await allDocs(source, 'products', { active: { equals: true } }),
    globals: await readGlobals(source, SYNCED_GLOBALS),
  }
  const dst: ExportData = {
    categories: await allDocs(dest, 'categories'),
    tags: await allDocs(dest, 'product-tags'),
    attributes: await allDocs(dest, 'product-attributes'),
    products: await allDocs(dest, 'products'),
    globals: await readGlobals(dest, SYNCED_GLOBALS),
  }

  const plan = computePlan(src, dst)

  console.log('sync:content plan (dry-run por defecto)')
  for (const c of ['categories', 'product-tags', 'product-attributes', 'products'] as const) {
    const list = plan.actions.filter((a) => a.collection === c)
    console.log(
      `  ${c}: create ${list.filter((a) => a.op === 'create').length}, ` +
        `update ${list.filter((a) => a.op === 'update').length}, ` +
        `unchanged ${list.filter((a) => a.op === 'unchanged').length}`,
    )
  }
  for (const g of plan.globalActions) {
    console.log(`  ${g.global}: ${g.op}`)
  }
  for (const w of plan.warnings) console.log(`  aviso: ${w}`)

  if (!args.apply) {
    console.log('DRY-RUN: nada escrito. Agregá --apply para escribir.')
    process.exit(0)
  }

  const client: SyncClient = {
    create: async (collection, data) =>
      (await dest.create({
        collection: collection as never,
        data: data as never,
        overrideAccess: true,
      } as never)) as unknown as Rec,
    update: async (collection, id, data) =>
      (await dest.update({
        collection: collection as never,
        id,
        data: data as never,
        overrideAccess: true,
      } as never)) as unknown as Rec,
    updateGlobal: async (slug, data) => {
      await dest.updateGlobal({
        slug: slug as never,
        data: data as never,
        overrideAccess: true,
      } as never)
    },
  }
  await applyPlan(client, plan, dst)

  console.log('APLICADO: escritura completa sin borrados.')
  process.exit(0)
}

main().catch((err) => {
  console.error(`sync:content: ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
