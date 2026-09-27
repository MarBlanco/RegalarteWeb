import type { Metadata } from 'next'
import { OrdersClient } from './orders-client'

export const metadata: Metadata = {
  title: 'Mis compras',
  description: 'Consultá el estado y detalle de tus pedidos.',
  alternates: {
    canonical: '/orders',
  },
}

/**
 * Mis compras: contenido centrado sin sidebar. La única navegación de
 * cuenta es el Account Menu del header.
 */
export default function OrdersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBF7F1]">
      <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <section className="min-w-0" aria-label="Mis compras">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#1F1B16] sm:text-4xl">
            Mis compras
          </h1>
          <p className="mt-1.5 text-sm text-[#7A6A5D] sm:text-[15px]">
            Consultá el estado y detalle de tus pedidos.
          </p>
          <div className="mt-5">
            <OrdersClient />
          </div>
        </section>
      </div>
    </div>
  )
}
