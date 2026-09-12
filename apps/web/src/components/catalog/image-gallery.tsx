'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
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

/**
 * Galería PDP estilo mock: columna de thumbnails a la izquierda (fila en
 * mobile), imagen principal con botón de zoom que abre vista ampliada.
 */
export function ImageGallery({ images, fallbackAlt }: ImageGalleryProps) {
  const [activeId, setActiveId] = useState<number | null>(
    images[0]?.id ?? null,
  )
  const [zoomOpen, setZoomOpen] = useState(false)

  const closeZoom = useCallback(() => setZoomOpen(false), [])

  useEffect(() => {
    if (!zoomOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [zoomOpen, closeZoom])

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-[#EBDFD1] bg-[#F4EDE4] text-sm text-[#9A8A7A]">
        Sin imagen disponible
      </div>
    )
  }

  const activeImage =
    images.find((image) => image.id === activeId) ?? images[0]

  return (
    <>
      <div className="flex flex-col-reverse gap-3 lg:flex-row">
        {images.length > 1 ? (
          <ul
            className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:max-h-[520px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Miniaturas del producto"
          >
            {images.map((image) => (
              <li key={image.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveId(image.id)}
                  aria-selected={image.id === activeImage.id}
                  role="tab"
                  aria-label={`Ver imagen: ${image.alt ?? fallbackAlt}`}
                  className={cn(
                    'relative block h-16 w-16 overflow-hidden rounded-md border transition-all sm:h-20 sm:w-20',
                    image.id === activeImage.id
                      ? 'border-[#B85C33] ring-1 ring-[#B85C33]'
                      : 'border-[#EBDFD1] hover:border-[#C45A37]/60',
                  )}
                >
                  {image.url ? (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[#F4EDE4] text-[10px] text-[#9A8A7A]">
                      Imagen
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-lg border border-[#EBDFD1] bg-[#F4EDE4]">
          {activeImage.url ? (
            <Image
              src={activeImage.url}
              alt={activeImage.alt ?? fallbackAlt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#9A8A7A]">
              {activeImage.alt ?? fallbackAlt}
            </div>
          )}
          {activeImage.url ? (
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Ampliar imagen"
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#38271D] shadow-md transition-colors hover:text-[#C45A37]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M11 8v6" />
                <path d="M8 11h6" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {zoomOpen && activeImage.url ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={closeZoom}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada del producto"
        >
          <div className="relative h-[85vh] w-full max-w-3xl overflow-hidden rounded-lg bg-background">
            <Image
              src={activeImage.url}
              alt={activeImage.alt ?? fallbackAlt}
              fill
              sizes="90vw"
              className="object-contain"
            />
            <button
              type="button"
              onClick={closeZoom}
              aria-label="Cerrar vista ampliada"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#38271D] shadow-md hover:text-[#C45A37]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
