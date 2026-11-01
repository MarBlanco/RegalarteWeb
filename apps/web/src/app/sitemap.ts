import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''

// Se regenera cada hora: los productos nuevos aparecen sin redeploy.
export const revalidate = 3600

async function productEntries(now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'products',
      where: { active: { not_equals: false } },
      limit: 1000,
      depth: 0,
      pagination: false,
      select: { slug: true, updatedAt: true },
    })
    return docs
      .filter((p) => typeof p.slug === 'string' && p.slug.length > 0)
      .map((p) => ({
        url: `${SITE_URL}/catalogo/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch {
    // Sin base de datos (build sin credenciales, caída): el sitemap base sigue siendo válido.
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!SITE_URL) return []

  const now = new Date()

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/solistica`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...(await productEntries(now)),
  ]
}
