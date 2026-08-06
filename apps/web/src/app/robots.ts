import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = SITE_URL ? `${SITE_URL}/sitemap.xml` : '/sitemap.xml'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/checkout', '/cart', '/profile'],
      },
    ],
    sitemap: sitemapUrl,
  }
}
