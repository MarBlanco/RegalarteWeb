import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { DEFAULT_NAV_LINKS, resolveNavLinks, type NavLink } from '@/lib/navigation'

export const NAVIGATION_TAG = 'navigation'

async function readNavLinks(): Promise<NavLink[]> {
  const payload = await getPayload({ config })
  const stored = await payload.findGlobal({
    slug: 'navigation',
    depth: 1,
    overrideAccess: true,
  })
  return resolveNavLinks(stored)
}

const cachedNavLinks = unstable_cache(readNavLinks, ['navigation-links'], {
  tags: [NAVIGATION_TAG, 'categories'],
  revalidate: 300,
})

/**
 * Opciones visibles del Nav (servidor), cacheadas hasta que se edite. La
 * tienda nunca se rompe por el menú: si la DB no responde, defaults (y como
 * el error no se cachea, el próximo render reintenta).
 */
export async function getNavLinks(): Promise<NavLink[]> {
  try {
    return await cachedNavLinks()
  } catch {
    return DEFAULT_NAV_LINKS
  }
}
