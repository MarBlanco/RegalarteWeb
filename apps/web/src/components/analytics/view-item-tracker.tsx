'use client'

import { useEffect } from 'react'
import { trackViewItem } from '@/lib/analytics/ga'

/**
 * <ViewItemTracker /> — dispara el evento GA4 view_item cuando el usuario
 * llega a la pagina de detalle de un producto. Se renderiza del lado del
 * cliente porque el PDP es un Server Component y gtag vive en window.
 */
export function ViewItemTracker(product: {
  id: number | string
  title: string
  price: number
  compareAtPrice?: number | null
  categoryTitle?: string | null
}) {
  const { id, title, price, compareAtPrice, categoryTitle } = product
  useEffect(() => {
    trackViewItem({ id, title, price, compareAtPrice, categoryTitle })
  }, [id, title, price, compareAtPrice, categoryTitle])
  return null
}
