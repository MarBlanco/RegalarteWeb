'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  id: number
  url: string | null
  alt: string
  caption: string | null
}

export interface ImageGalleryProps {
  images: GalleryImage[]
  fallbackAlt: string
}

export function ImageGallery({ images, fallbackAlt }: ImageGalleryProps) {
  const [activeId, setActiveId] = useState<number | null>(
    images[0]?.id ?? null,
  )

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        Sin imagen disponible
      </div>
    )
  }

  const activeImage =
    images.find((image) => image.id === activeId) ?? images[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
        {activeImage.url ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt ?? fallbackAlt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            {activeImage.alt ?? fallbackAlt}
          </div>
        )}
        {activeImage.caption ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground">
            {activeImage.caption}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" role="tablist">
          {images.map((image) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveId(image.id)}
                aria-selected={image.id === activeImage.id}
                role="tab"
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-md border transition-all',
                  image.id === activeImage.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border hover:border-primary/50',
                )}
              >
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.alt ?? fallbackAlt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Imagen
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
