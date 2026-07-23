import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'newest'
    const categorySlug = searchParams.get('category.slug')

    const where: any = {
      isActive: { equals: true },
    }

    if (categorySlug) {
      where['category.slug'] = { equals: categorySlug }
    }

    const sortMap: Record<string, string> = {
      newest: '-createdAt',
      'price-asc': 'price',
      'price-desc': '-price',
      'name-asc': 'name',
      'name-desc': '-name',
    }

    const sortField = sortMap[sort] || '-createdAt'

    const result = await payload.find({
      collection: 'products',
      where,
      sort: sortField,
      page,
      limit,
      depth: 1,
    })

    return NextResponse.json({
      docs: result.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
        price: doc.price,
        wholesalePrice: doc.wholesalePrice,
        isWholesaleAvailable: doc.isWholesaleAvailable,
        images: doc.images || [],
        shortDescription: doc.shortDescription,
        category: doc.category
          ? {
              name: doc.category.name,
              slug: doc.category.slug,
            }
          : null,
      })),
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}