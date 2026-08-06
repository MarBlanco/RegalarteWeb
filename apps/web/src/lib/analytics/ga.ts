/**
 * Google Analytics 4 (gtag.js) — integration layer for TICKET-022.
 *
 * Contrato:
 *   - El script gtag.js se carga una sola vez via <GoogleAnalytics /> en el
 *     root layout, solo en production y solo si NEXT_PUBLIC_GA_MEASUREMENT_ID
 *     esta configurado. En dev o sin ID, todo es no-op.
 *   - Los helpers de eventos son safe-no-op si gtag no esta disponible
 *     (dev, ad-blockers, ID ausente). Nunca lanzan.
 *
 * Eventos estandar GA4:
 *   - page_view      (automatico via gtag config, reflejado en route changes)
 *   - view_item       (product detail)
 *   - add_to_cart     (cart add)
 *   - begin_checkout  (checkout page mount con items)
 *   - purchase        (order confirmada)
 *
 * Al alinear este modulo con la nomenclatura GA4 Ecommerce, dejamos tambien
 * preparado el terreno para PostHog (TICKET-023): los mismos helpers pueden
 * reemitir los eventos a un segundo destino en una iteracion futura.
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

export function isGaEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    Boolean(GA_MEASUREMENT_ID) &&
    GA_MEASUREMENT_ID !== 'G-PLACEHOLDER' &&
    typeof window !== 'undefined' &&
    typeof (window as unknown as { gtag?: unknown }).gtag === 'function'
  )
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

type GtagEvent = (...args: unknown[]) => void

function getGtag(): GtagEvent | null {
  if (!isGaEnabled()) return null
  return (window.gtag as GtagEvent | undefined) ?? null
}

/**
 * Helper interno: emite un evento GA4. Safe no-op si gtag no esta listo.
 */
function track(eventName: string, params: Record<string, unknown> = {}): void {
  const gtag = getGtag()
  if (!gtag) return
  gtag('event', eventName, params)
}

/**
 * Estructura de un item GA4 Ecommerce.
 * docs: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */
export interface EcommerceItem {
  item_id: string
  item_name: string
  item_category?: string
  price: number
  quantity: number
  discount?: number
  item_variant?: string
}

interface EcommerceEventParams {
  currency?: string
  value?: number
  transaction_id?: string
  items: EcommerceItem[]
}

const CURRENCY = 'ARS'

function cartItemToEcommerceItem(
  item: import('@/lib/cart/types').CartItem,
): EcommerceItem {
  const unit =
    item.isWholesaleAvailable && typeof item.wholesalePrice === 'number'
      ? item.wholesalePrice
      : item.price
  const discount =
    typeof item.compareAtPrice === 'number' && item.compareAtPrice > item.price
      ? (item.compareAtPrice - item.price) * item.quantity
      : undefined
  return {
    item_id: item.productId || item.id,
    item_name: item.name,
    price: unit,
    quantity: item.quantity,
    discount,
  }
}

/** view_item — fire on product detail mount. */
export function trackViewItem(product: {
  id: number | string
  title: string
  price: number
  compareAtPrice?: number | null
  categoryTitle?: string | null
}): void {
  const discount =
    typeof product.compareAtPrice === 'number' &&
    product.compareAtPrice > product.price
      ? product.compareAtPrice - product.price
      : undefined
  const item: EcommerceItem = {
    item_id: String(product.id),
    item_name: product.title,
    price: product.price,
    quantity: 1,
    discount,
    item_category: product.categoryTitle ?? undefined,
  }
  track('view_item', {
    currency: CURRENCY,
    value: product.price,
    items: [item],
  } satisfies EcommerceEventParams)
}

/** add_to_cart — fire when an item is added to the cart. */
export function trackAddToCart(
  item: import('@/lib/cart/types').CartItemInput,
): void {
  const unit =
    item.isWholesaleAvailable && typeof item.wholesalePrice === 'number'
      ? item.wholesalePrice
      : item.price
  const discount =
    typeof item.compareAtPrice === 'number' && item.compareAtPrice > item.price
      ? (item.compareAtPrice - item.price) * item.quantity
      : undefined
  track('add_to_cart', {
    currency: CURRENCY,
    value: unit * item.quantity,
    items: [
      {
        item_id: item.productId || item.id,
        item_name: item.name,
        price: unit,
        quantity: item.quantity,
        discount,
      },
    ],
  } satisfies EcommerceEventParams)
}

/** begin_checkout — fire on checkout page mount with items. */
export function trackBeginCheckout(
  items: ReadonlyArray<import('@/lib/cart/types').CartItem>,
  subtotal: number,
): void {
  track('begin_checkout', {
    currency: CURRENCY,
    value: subtotal,
    items: items.map(cartItemToEcommerceItem),
  } satisfies EcommerceEventParams)
}

/** purchase — fire when an order is confirmed. */
export function trackPurchase(
  orderId: string,
  items: ReadonlyArray<import('@/lib/cart/types').CartItem>,
  subtotal: number,
): void {
  track('purchase', {
    transaction_id: orderId,
    currency: CURRENCY,
    value: subtotal,
    items: items.map(cartItemToEcommerceItem),
  } satisfies EcommerceEventParams)
}
