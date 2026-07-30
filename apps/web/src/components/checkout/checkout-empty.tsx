'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function CheckoutEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </span>
        <h2 className="text-lg font-semibold">Tu carrito está vacío</h2>
        <p className="text-sm text-muted-foreground">
          No podés avanzar al checkout sin productos. Volvé al catálogo y elegí
          los regalos que querés enviar.
        </p>
        <div className="mt-2">
          <Button asChild size="lg">
            <Link href="/catalogo">Explorar catálogo</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
