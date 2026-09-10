'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useWishlistStore } from '@/lib/wishlist/store'
import { formatPrice } from '@/lib/format'

interface WishlistProductCardProps {
  id: string
  productId: string
  slug: string
  name: string
  price: number
  compareAtPrice: number | null
  wholesalePrice: number | null
  isWholesaleAvailable: boolean
  image: string | null
  addedAt: number
}

function WishlistProductCard({ item }: { item: WishlistProductCardProps }) {
  const { removeItem } = useWishlistStore()

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    removeItem(item.id)
  }

  return (
    <div className="group flex flex-col">
      <Link href={`/catalogo/${item.slug}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
          {item.isWholesaleAvailable ? (
            <span className="absolute top-2 right-2 rounded-full bg-wholesale px-2 py-1 text-xs font-medium text-wholesale-foreground">
              Mayorista
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <Link href={`/catalogo/${item.slug}`}>
          <h3 className="line-clamp-2 text-base font-medium leading-tight group-hover:text-primary">
            {item.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-semibold">{formatPrice(item.price)}</span>
          {item.compareAtPrice && item.compareAtPrice > item.price ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(item.compareAtPrice)}
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
        >
          Quitar de favoritos
        </Button>
      </div>
    </div>
  )
}

export function WishlistClient() {
  const items = useWishlistStore((state) => state.items)
  const hydrated = useWishlistStore((state) => state.hydrated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!hydrated) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando favoritos...</div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container py-8 lg:py-12">
        <header className="mb-8 lg:mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mis Favoritos
          </h1>
          <p className="mt-2 text-muted-foreground">
            {items.length === 0
              ? 'Aún no tienes productos guardados.'
              : `${items.length} ${items.length === 1 ? 'producto guardado' : 'productos guardados'}`}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3 3 5.1 3 7.5c0 1.387.63 2.642 1.593 3.498a12.061 12.061 0 002.817 5.023c.418.486.707 1.002.842 1.53l.61.814a9.495 9.495 0 011.892 3.183 11.958 11.958 0 003.01.738c2.892 0 5.235-1.568 6.307-3.865a2.879 2.879 0 00.765-2.02c0-1.116-.695-2.056-1.76-2.386a22.63 22.63 0 00-1.565-3.665A2.99 2.99 0 0018.766 5H6.5a2.99 2.99 0 00-1.464.55c-.376.302-.756.646-1.142.972a22.6 22.6 0 00-1.565-3.666 2.99 2.99 0 00-.77 1.737c-.06.32-.107.651-.107.99a2.88 2.88 0 00.767 2.02 28.748 28.748 0 015.907 3.857 11.958 11.958 0 003.01-.738 9.496 9.496 0 011.892-3.183l.61-.814c.135-.528.424-1.044.842-1.53a12.061 12.061 0 002.818-5.023C21 6.642 21 5.375 21 4c0-2.485-2.099-4.5-4.688-4.5z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-semibold">No tienes favoritos aún</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
              Empieza a guardar tus productos favoritos para encontrarlos fácilmente.
            </p>
            <Link href="/catalogo" className="mt-6 inline-block">
              <Button>Ir al catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WishlistProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface WishlistProductCardProps {
  id: string
  productId: string
  slug: string
  name: string
  price: number
  compareAtPrice: number | null
  wholesalePrice: number | null
  isWholesaleAvailable: boolean
  image: string | null
  addedAt: number
}