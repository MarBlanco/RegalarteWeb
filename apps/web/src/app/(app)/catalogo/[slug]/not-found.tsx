import Link from 'next/link'

export default function CatalogProductNotFound() {
  return (
    <div className="bg-background">
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Producto no encontrado
        </h1>
        <p className="mt-2 text-muted-foreground">
          El producto que buscás no existe o ya no está disponible.
        </p>
        <div className="mt-6">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}
