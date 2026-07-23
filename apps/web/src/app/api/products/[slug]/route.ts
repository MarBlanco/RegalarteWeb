import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'products',
      where: {
        slug: { equals: slug },
        isActive: { equals: true },
      },
      depth: 2,
      limit: 1,
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = result.docs[0] as any

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      wholesalePrice: product.wholesalePrice,
      isWholesaleAvailable: product.isWholesaleAvailable,
      images: product.images || [],
      category: product.category
        ? {
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      tags: product.tags?.map((tag: any) => ({
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      })) || [],
      attributes: product.attributes?.map((attr: any) => ({
        name: attr.name,
        value: attr.value,
        unit: attr.unit,
        group: attr.group,
      })) || [],
      sku: product.sku,
      stock: product.stock,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}