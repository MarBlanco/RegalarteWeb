'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

export interface CatalogPaginationProps {
  page: number
  totalPages: number
}

export function CatalogPagination({
  page,
  totalPages,
}: CatalogPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  if (totalPages <= 1) return null

  function buildHref(target: number) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('page', String(target))
    return `${pathname}?${next.toString()}`
  }

  function go(target: number) {
    if (target < 1 || target > totalPages || target === page) return
    startTransition(() => {
      router.push(buildHref(target))
    })
  }

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-center gap-2 pt-8"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => go(page - 1)}
        disabled={page <= 1 || isPending}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages || isPending}
      >
        Siguiente
      </Button>
    </nav>
  )
}
