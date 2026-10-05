export default function CatalogLoading() {
  return (
    <div className="bg-background">
      <div className="container py-8 lg:py-12">
        <header className="mb-8 lg:mb-12">
          <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
        </header>
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-64 lg:flex-shrink-0">
            <div className="h-96 animate-pulse rounded-xl border bg-card" />
          </aside>
          <section className="flex-1">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
